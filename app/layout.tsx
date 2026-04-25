import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VidDigest - AI YouTube Video Summarizer | Free & Instant",
  description: "Get instant AI-powered summaries of any YouTube video. Paste a link, get key takeaways in seconds. Supports 50+ languages. Free, no sign-up required. Powered by Google Gemini AI.",
  keywords: ["YouTube summarizer", "AI video summary", "YouTube video summary", "video summarizer", "AI summarizer", "YouTube transcript", "video to text", "VidDigest"],
  authors: [{ name: "Baishali Roy" }],
  creator: "Baishali Roy",
  publisher: "VidDigest",
  metadataBase: new URL("https://viddigest-ai.vercel.app"),
  openGraph: {
    title: "VidDigest - AI YouTube Video Summarizer",
    description: "Paste any YouTube link and get a clean, structured AI summary in seconds. Free, no sign-up needed. Supports 50+ languages.",
    url: "https://viddigest-ai.vercel.app",
    siteName: "VidDigest",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VidDigest - AI YouTube Video Summarizer",
    description: "Paste any YouTube link and get a clean, structured AI summary in seconds. Free, no sign-up needed.",
    creator: "@msbroy1601",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://viddigest-ai.vercel.app",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
