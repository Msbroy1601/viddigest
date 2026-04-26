/**
 * Custom YouTube transcript fetcher.
 *
 * The npm `youtube-transcript` package (v1.3.0) broke because:
 *   1. Its InnerTube Android-client request uses a stale client version and
 *      lacks the `po_token` / `visitor_data` YouTube now requires.
 *   2. Its web-page scraper sends a Chrome/85 User-Agent (2020), which
 *      YouTube's bot detection flags – especially from datacenter IPs.
 *
 * This module replaces it with three progressively more aggressive
 * strategies, each using up-to-date headers.
 */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/130.0.0.0 Safari/537.36";

const WEB_CLIENT_VERSION = "2.20250420.01.00";

// ---------------------------------------------------------------------------
// HTML-entity decoder
// ---------------------------------------------------------------------------
function decode(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCodePoint(parseInt(h, 16))
    )
    .replace(/&#(\d+);/g, (_, d) =>
      String.fromCodePoint(parseInt(d, 10))
    );
}

// ---------------------------------------------------------------------------
// Caption-track types (only what we need)
// ---------------------------------------------------------------------------
interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  name?: { simpleText?: string };
}

// ---------------------------------------------------------------------------
// Parse XML captions → plain text
// ---------------------------------------------------------------------------
function parseXml(xml: string): string[] {
  const segments: string[] = [];

  // Format A – <p t="..." d="..."><s>text</s></p> (newer)
  const pRe = /<p\s+t="\d+"\s+d="\d+"[^>]*>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = pRe.exec(xml)) !== null) {
    const inner = m[1];
    let text = "";
    const sRe = /<s[^>]*>([^<]*)<\/s>/g;
    let s: RegExpExecArray | null;
    while ((s = sRe.exec(inner)) !== null) text += s[1];
    if (!text) text = inner.replace(/<[^>]+>/g, "");
    text = decode(text).trim();
    if (text) segments.push(text);
  }
  if (segments.length > 0) return segments;

  // Format B – <text start="..." dur="...">text</text> (classic)
  const tRe = /<text[^>]*>([^<]*)<\/text>/g;
  while ((m = tRe.exec(xml)) !== null) {
    const t = decode(m[1]).trim();
    if (t) segments.push(t);
  }
  return segments;
}

// ---------------------------------------------------------------------------
// Strategy helpers
// ---------------------------------------------------------------------------

/** Extract JSON from an inline `var name = {...};` in a YouTube page. */
function extractInlineJson(html: string, varName: string): unknown | null {
  const anchor = `var ${varName} = `;
  let idx = html.indexOf(anchor);
  if (idx === -1) {
    const alt = `window["${varName}"] = `;
    idx = html.indexOf(alt);
    if (idx === -1) return null;
    idx += alt.length;
  } else {
    idx += anchor.length;
  }

  let depth = 0;
  for (let i = idx; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(idx, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function tracksFrom(data: unknown): CaptionTrack[] | null {
  const tracks = (data as any)?.captions?.playerCaptionsTracklistRenderer
    ?.captionTracks;
  return Array.isArray(tracks) && tracks.length > 0 ? tracks : null;
}

// ---------------------------------------------------------------------------
// Strategy 1 – Scrape the watch page with a modern UA
// ---------------------------------------------------------------------------
async function viaWatchPage(videoId: string): Promise<CaptionTrack[] | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/watch?v=${videoId}&hl=en`,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Cache-Control": "max-age=0",
        },
      }
    );
    const html = await res.text();

    if (html.includes('class="g-recaptcha"')) {
      console.warn("[transcript] CAPTCHA on watch page");
      return null;
    }

    const player = extractInlineJson(html, "ytInitialPlayerResponse");
    return tracksFrom(player);
  } catch (e) {
    console.warn("[transcript] watch-page failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Strategy 2 – InnerTube /player (WEB client)
// ---------------------------------------------------------------------------
async function viaInnerTubeWeb(
  videoId: string
): Promise<CaptionTrack[] | null> {
  try {
    const res = await fetch(
      "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT,
          "X-YouTube-Client-Name": "1",
          "X-YouTube-Client-Version": WEB_CLIENT_VERSION,
          Origin: "https://www.youtube.com",
          Referer: "https://www.youtube.com/",
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: WEB_CLIENT_VERSION,
              hl: "en",
              gl: "US",
            },
          },
          videoId,
        }),
      }
    );
    if (!res.ok) return null;
    return tracksFrom(await res.json());
  } catch (e) {
    console.warn("[transcript] InnerTube WEB failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Strategy 3 – InnerTube /player (ANDROID client, updated version)
// ---------------------------------------------------------------------------
async function viaInnerTubeAndroid(
  videoId: string
): Promise<CaptionTrack[] | null> {
  const clientVersion = "19.29.37";
  try {
    const res = await fetch(
      "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `com.google.android.youtube/${clientVersion} (Linux; U; Android 14)`,
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "ANDROID",
              clientVersion,
              hl: "en",
              gl: "US",
              androidSdkVersion: 34,
            },
          },
          videoId,
        }),
      }
    );
    if (!res.ok) return null;
    return tracksFrom(await res.json());
  } catch (e) {
    console.warn("[transcript] InnerTube ANDROID failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Strategy 4 – InnerTube /player (iOS client – sometimes bypasses blocks)
// ---------------------------------------------------------------------------
async function viaInnerTubeIOS(
  videoId: string
): Promise<CaptionTrack[] | null> {
  const clientVersion = "19.29.1";
  try {
    const res = await fetch(
      "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `com.google.ios.youtube/${clientVersion} (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X)`,
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "IOS",
              clientVersion,
              hl: "en",
              gl: "US",
              deviceMake: "Apple",
              deviceModel: "iPhone16,2",
              osName: "iPhone",
              osVersion: "17.5.1.21F90",
            },
          },
          videoId,
        }),
      }
    );
    if (!res.ok) return null;
    return tracksFrom(await res.json());
  } catch (e) {
    console.warn("[transcript] InnerTube IOS failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the transcript text for a YouTube video.
 *
 * Tries four strategies in order:
 *   1. Watch-page scrape (modern UA)
 *   2. InnerTube WEB client
 *   3. InnerTube ANDROID client
 *   4. InnerTube IOS client
 *
 * For each set of caption tracks found, tries the preferred languages in
 * order before falling back to the first available track.
 */
export async function fetchTranscript(
  videoId: string,
  preferredLangs: string[] = ["en", "hi", "es", "fr", "de", "ja", "ko", "pt", "ru", "zh"]
): Promise<string> {
  const strategies = [
    { name: "watch-page", fn: () => viaWatchPage(videoId) },
    { name: "innertube-web", fn: () => viaInnerTubeWeb(videoId) },
    { name: "innertube-android", fn: () => viaInnerTubeAndroid(videoId) },
    { name: "innertube-ios", fn: () => viaInnerTubeIOS(videoId) },
  ];

  for (const { name, fn } of strategies) {
    const tracks = await fn();
    if (!tracks) continue;

    // Pick the best track
    let track: CaptionTrack | undefined;
    for (const lang of preferredLangs) {
      track = tracks.find((t) => t.languageCode === lang);
      if (track) break;
    }
    if (!track) track = tracks[0];

    // Validate URL
    try {
      const u = new URL(track.baseUrl);
      if (!u.hostname.endsWith(".youtube.com") && !u.hostname.endsWith(".google.com")) {
        console.warn(`[transcript] suspicious caption URL host: ${u.hostname}`);
        continue;
      }
    } catch {
      continue;
    }

    // Fetch the captions
    try {
      const res = await fetch(track.baseUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      if (!res.ok) {
        console.warn(`[transcript] caption fetch ${res.status} via ${name}`);
        continue;
      }

      const xml = await res.text();
      const segments = parseXml(xml);

      if (segments.length > 0) {
        console.log(
          `[transcript] success via ${name} (${track.languageCode}, ${segments.length} segments)`
        );
        return segments.join(" ");
      }
    } catch (e) {
      console.warn(`[transcript] caption download failed via ${name}:`, e);
    }
  }

  throw new Error(
    "Could not extract the transcript for this video. " +
      "The video might not have captions available, or it may be a " +
      "music/instrumental video without dialogue."
  );
}
