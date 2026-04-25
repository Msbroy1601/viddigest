# VidDigest

AI-powered YouTube video summarizer that turns any YouTube video into a clean, structured summary in seconds. Built with Next.js, Google Gemini AI, and deployed on Vercel.

**Live Demo:** [viddigest-ai.vercel.app](https://viddigest-ai.vercel.app)

## Features

### Instant AI Summaries
- Paste any YouTube video URL and get a structured summary in seconds
- Extracts key takeaways, main points, and detailed insights
- Generates TLDR, bullet-point summaries, and full breakdowns

### Multi-Language Support
- Works with videos in 50+ languages
- Automatic transcript extraction regardless of video language
- Handles Hindi, Spanish, French, German, Japanese, and many more

### Smart Transcript Extraction
- Automatically fetches video transcripts using multiple fallback methods
- Works with regular videos, Shorts, and long-form content
- Gracefully handles edge cases like music-only or captionless videos

### No Sign-Up Required
- Completely free to use
- No account creation needed
- No rate limiting for casual use

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Framer Motion |
| **AI Engine** | Google Gemini 2.5 Flash |
| **Transcript** | youtube-transcript library |
| **Analytics** | Vercel Analytics |
| **Deployment** | Vercel |
| **Particles** | tsparticles |

## Architecture

- **Frontend:** Next.js app with a dark-themed, responsive UI featuring animated particles, smooth transitions, and a clean single-page layout
- **API Routes:** Next.js API routes handle transcript extraction and Gemini AI summarization server-side
- **Transcript Extraction:** Fetches YouTube video transcripts with automatic language detection and fallback handling
- **AI Summarization:** Sends transcripts to Google Gemini 2.5 Flash for intelligent, structured summarization

## Project Structure

```
viddigest/
├── app/
│   ├── api/
│   │   ├── transcript/       # YouTube transcript extraction API
│   │   └── summarize/        # Gemini AI summarization API
│   ├── layout.tsx            # Root layout with SEO meta tags
│   ├── page.tsx              # Main application page
│   ├── sitemap.ts            # Dynamic sitemap generation
│   └── robots.ts             # Robots.txt configuration
├── components/
│   ├── Hero.tsx              # Landing hero with particles effect
│   ├── Summarizer.tsx        # Main summarizer tool component
│   ├── HowItWorks.tsx        # Three-step explainer section
│   ├── FAQ.tsx               # Frequently asked questions
│   └── Footer.tsx            # Site footer
├── lib/
│   └── utils.ts              # Utility functions
└── public/                   # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key ([get one here](https://makersuite.google.com/app/apikey))

### 1. Clone the Repository

```bash
git clone https://github.com/Msbroy1601/viddigest.git
cd viddigest
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Access the Application

- **Frontend:** [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Paste a Link** — Copy any YouTube video URL and paste it into VidDigest
2. **AI Transcribes** — We extract the transcript in 50+ languages automatically
3. **Get Your Summary** — Receive a TLDR, key takeaways, and a detailed summary in seconds

## SEO & Meta Tags

VidDigest includes comprehensive SEO optimization:

- Open Graph tags for social media sharing
- Twitter Card meta tags
- Structured keywords for search engines
- Canonical URL configuration
- Google bot directives for optimal indexing
- Google Search Console verified with sitemap submission

## Deployment

The app is deployed on **Vercel** with automatic deployments from the `main` branch. Every push to `main` triggers a new production deployment.

## To-Do

- [ ] Add support for playlist summarization
- [ ] Export summaries as PDF
- [ ] Browser extension for one-click summaries
- [ ] User history / saved summaries
- [ ] Share summary via link

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## Author

**Baishali Roy** — [@msbroy1601](https://github.com/Msbroy1601)

Built with ❤️ using Next.js, Google Gemini AI, and deployed on Vercel.

## License

This project is open source and available under the [MIT License](LICENSE).# VidDigest

AI-powered YouTube video summarizer that turns any YouTube video into a clean, structured summary in seconds. Built with Next.js, Google Gemini AI, and deployed on Vercel.

**Live Demo:** [viddigest-ai.vercel.app](https://viddigest-ai.vercel.app)

## Features

### Instant AI Summaries
- Paste any YouTube video URL and get a structured summary in seconds
- Extracts key takeaways, main points, and detailed insights
- Generates TLDR, bullet-point summaries, and full breakdowns

### Multi-Language Support
- Works with videos in 50+ languages
- Automatic transcript extraction regardless of video language
- Handles Hindi, Spanish, French, German, Japanese, and many more

### Smart Transcript Extraction
- Automatically fetches video transcripts using multiple fallback methods
- Works with regular videos, Shorts, and long-form content
- Gracefully handles edge cases like music-only or captionless videos

### No Sign-Up Required
- Completely free to use
- No account creation needed
- No rate limiting for casual use

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Framer Motion |
| **AI Engine** | Google Gemini 2.5 Flash |
| **Transcript** | youtube-transcript library |
| **Analytics** | Vercel Analytics |
| **Deployment** | Vercel |
| **Particles** | tsparticles |

## Architecture

- **Frontend:** Next.js app with a dark-themed, responsive UI featuring animated particles, smooth transitions, and a clean single-page layout
- **API Routes:** Next.js API routes handle transcript extraction and Gemini AI summarization server-side
- **Transcript Extraction:** Fetches YouTube video transcripts with automatic language detection and fallback handling
- **AI Summarization:** Sends transcripts to Google Gemini 2.5 Flash for intelligent, structured summarization

## Project Structure

\`\`\`
viddigest/
├── app/
│   ├── api/
│   │   ├── transcript/    # YouTube transcript extraction API
│   │   └── summarize/     # Gemini AI summarization API
│   ├── layout.tsx         # Root layout with SEO meta tags
│   └── page.tsx           # Main application page
├── components/
│   ├── Hero.tsx           # Landing hero with particles effect
│   ├── Summarizer.tsx     # Main summarizer tool component
│   ├── HowItWorks.tsx     # Three-step explainer section
│   ├── FAQ.tsx            # Frequently asked questions
│   └── Footer.tsx         # Site footer
├── lib/
│   └── utils.ts           # Utility functions
└── public/                # Static assets
\`\`\`

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key ([get one here](https://makersuite.google.com/app/apikey))

### 1. Clone the Repository

\`\`\`bash
cd viddigest
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Configure Environment Variables

Create a \`.env.local\` file in the root directory:

\`\`\`bash
GEMINI_API_KEY=your-gemini-api-key-here
\`\`\`

### 4. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

### 5. Access the Application

- **Frontend:** [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Paste a Link** — Copy any YouTube video URL and paste it into VidDigest
2. **AI Transcribes** — We extract the transcript in 50+ languages automatically
3. **Get Your Summary** — Receive a TLDR, key takeaways, and a detailed summary in seconds

## SEO & Meta Tags

VidDigest includes comprehensive SEO optimization:
- Open Graph tags for social media sharing
- Twitter Card meta tags
- Structured keywords for search engines
- Canonical URL configuration
- Google bot directives for optimal indexing

## Deployment

The app is deployed on **Vercel** with automatic deployments from the \`main\` branch. Every push to \`main\` triggers a new production deployment.

## To-Do

- [ ] Add support for playlist summarization
- [ ] Export summaries as PDF
- [ ] Browser extension for one-click summaries
- [ ] User history / saved summaries
- [ ] Share summary via link

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## Author

**Baishali Roy** — [@msbroy1601](https://github.com/Msbroy1601)

Built with ❤️ using Next.js, Google Gemini AI, and deployed on Vercel.

## License

This project is open source and available under the [MIT License](LICENSE).
