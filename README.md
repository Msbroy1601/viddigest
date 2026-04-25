# VidDigest

AI-powered YouTube video summarizer that turns any YouTube video into a clean, structured summary in seconds. Built with Next.js, Google Gemini AI, and deployed on Vercel.

**Live Demo:** [viddigest-ai.vercel.app](https://viddigest-ai.vercel.app)

## Features

- Paste any YouTube video URL and get an instant AI summary
- Supports 50+ languages with automatic language detection
- Clean, structured output with key takeaways and timestamps
- Works with regular videos, shorts, and long-form content
- Handles music/instrumental videos gracefully
- User-friendly error messages for all edge cases
- SEO optimized with meta tags, sitemap, and robots.txt
- Google Search Console verified for indexing
- Fast and responsive UI built with shadcn/ui and Tailwind CSS
- Deployed on Vercel with analytics

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **AI Model:** Google Gemini 2.5 Flash
- **Styling:** Tailwind CSS + shadcn/ui
- **Transcript Extraction:** youtube-transcript (npm)
- **Deployment:** Vercel
- **Analytics:** Vercel Analytics

## Project Structure

```
viddigest/
├── app/
│   ├── api/
│   │   └── summarize/
│   │       └── route.ts          # API endpoint for summarization
│   ├── layout.tsx                 # Root layout with metadata & SEO
│   ├── page.tsx                   # Main page
│   ├── globals.css                # Global styles
│   ├── sitemap.ts                 # Auto-generated sitemap.xml
│   └── robots.ts                  # Auto-generated robots.txt
├── components/
│   ├── hero-section.tsx           # Hero with sparkles effect
│   ├── summarizer-tool.tsx        # Main summarizer component
│   ├── how-it-works.tsx           # How it works section
│   ├── faq-section.tsx            # FAQ accordion
│   └── footer.tsx                 # Footer
├── lib/
│   └── utils.ts                   # Utility functions
├── public/
│   └── favicon.ico
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

```bash
git clone https://github.com/Msbroy1601/viddigest.git
cd viddigest
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Paste a YouTube URL** — any video, short, or long-form content
2. **Transcript extraction** — the app fetches the video transcript automatically
3. **AI summarization** — Google Gemini processes the transcript and generates a structured summary
4. **Read your summary** — get key takeaways, timestamps, and a clean overview

## SEO

- Full metadata with Open Graph and Twitter cards
- Auto-generated `sitemap.xml` and `robots.txt` via Next.js Metadata API
- Google Search Console verified and indexed
- Canonical URL configured

## Author

**Baishali Roy** — [@Msbroy1601](https://github.com/Msbroy1601)

Built with ❤️ using Next.js, Google Gemini AI, and deployed on Vercel.

## License

This project is open source and available under the [MIT License](LICENSE).
