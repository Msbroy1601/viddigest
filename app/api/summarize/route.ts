import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export const maxDuration = 60;

// --- Video ID extraction -----------------------------------------
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// --- Response parsing --------------------------------------------

function parseResponse(text: string): {
  tldr: string;
  keyPoints: string[];
  detailedSummary: string;
} {
  // Try structured delimiters first
  const tldrMatch = text.match(/===\s*TLDR\s*===\s*([\s\S]*?)(?=\n\s*===|$)/i);
  const keyPointsMatch = text.match(
    /===\s*KEY POINTS\s*===\s*([\s\S]*?)(?=\n\s*===|$)/i
  );
  // Use greedy match for detailed summary since it is the last section
  const detailedMatch = text.match(
    /===\s*DETAILED SUMMARY\s*===\s*([\s\S]*)$/i
  );

  const tldr = tldrMatch ? tldrMatch[1].trim() : text.slice(0, 300);
  const keyPoints = keyPointsMatch
    ? keyPointsMatch[1]
        .trim()
        .split(/\n/)
        .map((line) => line.replace(/^[-*\u2022\d.)]+\s*/, "").trim())
        .filter(Boolean)
    : [];
  let detailedSummary = detailedMatch ? detailedMatch[1].trim() : "";

  // Fallback: if no structured output detected, split text heuristically
  if (!tldrMatch && !keyPointsMatch && !detailedMatch) {
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length >= 3) {
      return {
        tldr: lines.slice(0, 2).join(" "),
        keyPoints: lines.slice(2, Math.min(8, lines.length)).map(l => l.replace(/^[-*\u2022\d.)]+\s*/, "").trim()),
        detailedSummary: lines.slice(2).join("\n"),
      };
    }
  }

  return { tldr, keyPoints, detailedSummary };
}

// --- Prompts -----------------------------------------------------

const TRANSCRIPT_PROMPT = `You are an expert content summarizer. Summarize this YouTube video based on its transcript.
If the content is in a non-English language, provide the summary in English.

Use this exact format:

=== TLDR ===
2-3 concise sentences.

=== KEY POINTS ===
- Bullet points (4-8)

=== DETAILED SUMMARY ===
Thorough paragraph-form summary.
`;

const GEMINI_VIDEO_PROMPT = `You are an expert content summarizer. Summarize this YouTube video.
If the video is in a non-English language, provide the summary in English.

Use this exact format:

=== TLDR ===
2-3 concise sentences.

=== KEY POINTS ===
- Bullet points (4-8)

=== DETAILED SUMMARY ===
Thorough paragraph-form summary.
`;

const CHUNK_PROMPT =
  "Summarize this portion of a video transcript concisely. Include the main points and key details.";

const COMBINE_PROMPT = `You are an expert content summarizer. You will receive summaries of different parts of a video. Combine them into a single cohesive summary.

Use this exact format:

=== TLDR ===
2-3 concise sentences.

=== KEY POINTS ===
- Bullet points (4-8)

=== DETAILED SUMMARY ===
Thorough paragraph-form summary.
`;

// --- Transcript extraction ---------------------------------------

async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Abort on CAPTCHA
    if (html.includes("captcha") || html.includes("unusual traffic")) {
      console.log("[transcript] CAPTCHA detected, skipping");
      return null;
    }

    // Extract caption tracks from player config
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) {
      console.log("[transcript] No caption tracks found in page");
      return null;
    }

    let tracks: Array<{ languageCode?: string; baseUrl?: string }>;
    try {
      tracks = JSON.parse(captionMatch[1]);
    } catch {
      return null;
    }
    if (!tracks.length) return null;

    // Prefer English, fallback to first available language
    const track =
      tracks.find((t) => t.languageCode?.startsWith("en")) || tracks[0];
    if (!track?.baseUrl) return null;

    const captionRes = await fetch(track.baseUrl);
    if (!captionRes.ok) return null;
    const xml = await captionRes.text();

    // Parse <text> elements from timed-text XML
    const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
    const segments: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = textRegex.exec(xml)) !== null) {
      const decoded = m[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\n/g, " ")
        .trim();
      if (decoded) segments.push(decoded);
    }

    const transcript = segments.join(" ").trim();
    if (transcript.length < 50) return null;

    console.log(
      `[transcript] Extracted ${transcript.length} chars for ${videoId}`
    );
    return transcript;
  } catch (err) {
    console.log("[transcript] Extraction failed:", err);
    return null;
  }
}

// --- Chunk long transcripts --------------------------------------

function chunkTranscript(
  transcript: string,
  maxTokens: number = 5000
): string[] {
  const maxChars = maxTokens * 4; // ~4 chars per token
  if (transcript.length <= maxChars) return [transcript];

  const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [transcript];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  console.log(
    `[chunk] Split ${transcript.length} chars into ${chunks.length} chunks`
  );
  return chunks;
}

// --- Provider 1: Groq --------------------------------------------

async function tryGroq(transcript: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log("[groq] No API key configured, skipping");
    return null;
  }

  try {
    const groq = new Groq({ apiKey });
    const chunks = chunkTranscript(transcript, 5000);

    if (chunks.length === 1) {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: TRANSCRIPT_PROMPT },
          { role: "user", content: `Here is the transcript:\n\n${transcript}` },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });
      return completion.choices[0]?.message?.content || null;
    }

    // Multi-chunk: summarize each, then combine
    const chunkSummaries: string[] = [];
    for (const chunk of chunks) {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: CHUNK_PROMPT },
          { role: "user", content: chunk },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });
      const summary = completion.choices[0]?.message?.content;
      if (summary) chunkSummaries.push(summary);
    }

    const combined = chunkSummaries.join("\n\n---\n\n");
    const finalCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: COMBINE_PROMPT },
        { role: "user", content: combined },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });
    return finalCompletion.choices[0]?.message?.content || null;
  } catch (err) {
    console.error("[groq] Failed:", err);
    return null;
  }
}

// --- Provider 2: Gemini (native video understanding) -------------

async function tryGemini(videoId: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.log("[gemini] No API key configured, skipping");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as any });
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Race against a 55-second timeout (Vercel Hobby limit is 60s)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), 55000)
    );

    const contentPromise = model.generateContent([
      {
        fileData: {
          fileUri: youtubeUrl,
          mimeType: "video/mp4",
        },
      },
      { text: GEMINI_VIDEO_PROMPT },
    ]);

    const result = await Promise.race([contentPromise, timeoutPromise]);

    const rawText = result.response.text();
    if (!rawText || rawText.trim().length === 0) return null;

    // Detect AI refusal (model says it cannot access the video)
    const refusalPatterns = [
      "I cannot access",
      "I'm unable to access",
      "I can't access",
      "I do not have the ability",
      "I am unable to",
      "I'm not able to",
      "cannot browse",
      "can't browse",
      "unable to watch",
      "cannot watch",
    ];
    const lower = rawText.toLowerCase();
    if (refusalPatterns.some((p) => lower.includes(p.toLowerCase()))) {
      console.log("[gemini] Model refused to process video");
      return null;
    }

    return rawText;
  } catch (err) {
    if (err instanceof Error && err.message === "GEMINI_TIMEOUT") {
      console.log("[gemini] Timed out after 55s");
    } else {
      console.error("[gemini] Failed:", err);
    }
    return null;
  }
}

// --- Provider 3: OpenRouter (free model, REST API) ---------------

async function tryOpenRouter(transcript: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log("[openrouter] No API key configured, skipping");
    return null;
  }

  async function callOpenRouter(
    systemPrompt: string,
    userContent: string
  ): Promise<string | null> {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://viddigest.vercel.app",
        "X-Title": "VidDigest",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      console.error("[openrouter] HTTP", res.status);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  }

  try {
    const chunks = chunkTranscript(transcript, 6000);

    if (chunks.length === 1) {
      return await callOpenRouter(
        TRANSCRIPT_PROMPT,
        `Here is the transcript:\n\n${transcript}`
      );
    }

    // Multi-chunk
    const chunkSummaries: string[] = [];
    for (const chunk of chunks) {
      const summary = await callOpenRouter(CHUNK_PROMPT, chunk);
      if (summary) chunkSummaries.push(summary);
    }

    const combined = chunkSummaries.join("\n\n---\n\n");
    return await callOpenRouter(COMBINE_PROMPT, combined);
  } catch (err) {
    console.error("[openrouter] Failed:", err);
    return null;
  }
}

// --- Main POST handler ------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid YouTube URL." },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      return NextResponse.json(
        {
          error:
            "That doesn't look like a valid YouTube link. Please use a URL like https://www.youtube.com/watch?v=...",
        },
        { status: 400 }
      );
    }

    console.log(`\n[summarize] --- Processing video: ${videoId} ---`);

    // Step 1: Try extracting transcript (needed for Groq & OpenRouter)
    const transcript = await fetchTranscript(videoId);
    console.log(
      `[summarize] Transcript: ${transcript ? `${transcript.length} chars` : "unavailable (will skip text-based providers)"}`
    );

    let rawText: string | null = null;
    let source = "";

    // -- Provider 1: Groq (needs transcript) --
    if (transcript) {
      console.log("[summarize] -> Trying Groq (llama-3.3-70b-versatile)...");
      rawText = await tryGroq(transcript);
      if (rawText) {
        source = "Groq";
        console.log("[summarize] Groq succeeded");
      } else {
        console.log("[summarize] Groq failed, moving to next provider");
      }
    }

    // -- Provider 2: Gemini (native video -- no transcript needed) --
    if (!rawText) {
      console.log(
        "[summarize] -> Trying Gemini (native video understanding)..."
      );
      rawText = await tryGemini(videoId);
      if (rawText) {
        source = "Gemini";
        console.log("[summarize] Gemini succeeded");
      } else {
        console.log("[summarize] Gemini failed, moving to next provider");
      }
    }

    // -- Provider 3: OpenRouter (needs transcript) --
    if (!rawText && transcript) {
      console.log("[summarize] -> Trying OpenRouter (llama-3.1-8b:free)...");
      rawText = await tryOpenRouter(transcript);
      if (rawText) {
        source = "OpenRouter";
        console.log("[summarize] OpenRouter succeeded");
      } else {
        console.log("[summarize] OpenRouter failed");
      }
    }

    // -- All providers exhausted --
    if (!rawText) {
      console.log("[summarize] All providers failed for video", videoId);
      return NextResponse.json(
        {
          error:
            "All AI services are temporarily busy. Please try again in a few minutes.",
        },
        { status: 503 }
      );
    }

    console.log(`[summarize] --- Done (via ${source}) ---\n`);

    const { tldr, keyPoints, detailedSummary } = parseResponse(rawText);

    return NextResponse.json({
      videoId,
      tldr,
      keyPoints,
      detailedSummary,
      source,
    });
  } catch (error: unknown) {
    console.error("Summarize API error:", error);

    let message =
      "Something went wrong while generating the summary. Please try again.";

    if (error instanceof Error) {
      if (error.message?.includes("quota")) {
        message =
          "We've hit our usage limit for now. Please try again in a few minutes.";
      } else if (
        error.message?.includes("not found") ||
        error.message?.includes("unavailable")
      ) {
        message =
          "This video could not be processed. It may be private, age-restricted, or unavailable.";
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
