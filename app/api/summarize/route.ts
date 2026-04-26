import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

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

const PROMPT = `You are an expert content summarizer. Summarize this YouTube video.
If the video is in a non-English language, provide the summary in English.

Use this exact format:

=== TLDR ===
2-3 concise sentences.

=== KEY POINTS ===
- Bullet points (4-8)

=== DETAILED SUMMARY ===
Thorough paragraph-form summary.
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

    // --- Summarize with Gemini (native YouTube video understanding) ---
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "The summarization service is not configured. Please try again later." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const result = await model.generateContent([
      {
        fileData: {
          fileUri: youtubeUrl,
          mimeType: "video/mp4",
        },
      },
      { text: PROMPT },
    ]);

    const response = result.response;
    const rawText = response.text();

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not generate a summary for this video. The video might be too short, private, or unavailable.",
        },
        { status: 422 }
      );
    }

    // Validate that Gemini actually summarized the video (not a refusal)
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
    const lowerText = rawText.toLowerCase();
    const isRefusal = refusalPatterns.some((p) => lowerText.includes(p.toLowerCase()));

    if (isRefusal) {
      return NextResponse.json(
        {
          error:
            "Could not process this video. The AI was unable to analyze it. Please try a different video.",
        },
        { status: 422 }
      );
    }

    const { tldr, keyPoints, detailedSummary } = parseResponse(rawText);

    return NextResponse.json({
      videoId,
      tldr,
      keyPoints,
      detailedSummary,
      source: "gemini-2.5-flash-youtube",
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
        error.message?.includes("unavailable") ||
        error.message?.includes("Could not")
      ) {
        message =
          "This video could not be processed. It may be private, age-restricted, or unavailable.";
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
