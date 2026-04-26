import { NextRequest, NextResponse } from "next/server";
import { fetchTranscript } from "@/lib/transcript";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";

const MAX_TRANSCRIPT_LENGTH = 100_000;

/**
 * Extract a YouTube video ID from various URL formats:
 *   youtube.com/watch?v=ID
 *   youtu.be/ID
 *   youtube.com/shorts/ID
 *   youtube.com/embed/ID
 */
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

/**
 * Parse the structured Gemini response into typed sections.
 */
function parseResponse(text: string): {
  tldr: string;
  keyPoints: string[];
  detailedSummary: string;
} {
  const tldrMatch = text.match(
    /===\s*TLDR\s*===\s*([\s\S]*?)(?=\n===|$)/i
  );
  const keyPointsMatch = text.match(
    /===\s*KEY POINTS\s*===\s*([\s\S]*?)(?=\n===|$)/i
  );
  const detailedMatch = text.match(
    /===\s*DETAILED SUMMARY\s*===\s*([\s\S]*?)$/i
  );

  const tldr = tldrMatch ? tldrMatch[1].trim() : text.slice(0, 300);

  const keyPoints = keyPointsMatch
    ? keyPointsMatch[1]
        .trim()
        .split(/\n/)
        .map((line) => line.replace(/^[-*\u2022]\s*/, "").trim())
        .filter(Boolean)
    : [];

  const detailedSummary = detailedMatch
    ? detailedMatch[1].trim()
    : "";

  return { tldr, keyPoints, detailedSummary };
}

const PROMPT = `You are an expert content summarizer. Given the transcript of a YouTube video,
produce a structured summary. If the transcript is in a non-English language,
provide the summary in English.

=== TLDR ===
2-3 concise sentences.

=== KEY POINTS ===
- Bullet points (4-8)

=== DETAILED SUMMARY ===
Thorough paragraph-form summary.

Here is the transcript:
`;

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

    // --- Fetch transcript ---
    let transcript = "";
    try {
      transcript = await fetchTranscript(videoId);
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not extract the transcript for this video. The video might not have captions available, or it may be a music/instrumental video without dialogue.",
        },
        { status: 422 }
      );
    }

    if (!transcript.trim()) {
      return NextResponse.json(
        {
          error:
            "The transcript for this video appears to be empty. This usually happens with music videos or videos without spoken content.",
        },
        { status: 422 }
      );
    }

    // Truncate very long transcripts
    if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
      transcript = transcript.slice(0, MAX_TRANSCRIPT_LENGTH);
    }

    // --- Summarize with Gemini ---
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "The summarization service is not configured. Please try again later." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(PROMPT + transcript);
    const response = result.response;
    const rawText = response.text();

    const { tldr, keyPoints, detailedSummary } = parseResponse(rawText);

    return NextResponse.json({
      videoId,
      tldr,
      keyPoints,
      detailedSummary,
      source: "custom-transcript + gemini-2.5-flash",
    });
  } catch (error: unknown) {
    console.error("Summarize API error:", error);

    const message =
      error instanceof Error && error.message?.includes("quota")
        ? "We've hit our usage limit for now. Please try again in a few minutes."
        : "Something went wrong while generating the summary. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
