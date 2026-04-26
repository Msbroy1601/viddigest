"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SummaryResult {
  videoId: string;
  tldr: string;
  keyPoints: string[];
  detailedSummary: string;
  source: string;
}

const loadingMessages = [
  "Analyzing video...",
  "Generating summary...",
];

export function Summarizer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setLoading(true);
    setLoadingStage(0);
    setResult(null);
    setError(null);
    setDetailsOpen(false);

    // Advance loading message after a delay
    const timer = setTimeout(() => setLoadingStage(1), 3000);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 65000);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal,
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setError("Received an unexpected response from the server. Please try again.");
        return;
      }

      if (!res.ok) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data);
      // Scroll to results after a short delay for rendering
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("The request timed out. The video may be too long or the server is busy. Please try again.");
      } else {
        setError("Unable to connect to the server. Please check your internet connection and try again.");
      }
    } finally {
      clearTimeout(timeout);
      clearTimeout(timer);
      setLoading(false);
    }
  };

  return (
    <section
      id="summarizer"
      className="relative w-full py-20 sm:py-28 bg-[#0a0a0a]"
    >
      {/* Top fade from previous section */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black to-transparent pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Try It{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-600">
              Now
            </span>
          </h2>
          <p className="mt-4 text-neutral-400 text-base sm:text-lg max-w-md mx-auto">
            Paste any YouTube link and get an instant summary
          </p>
        </motion.div>

        {/* Input form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            required
            disabled={loading}
            className="flex-1 rounded-xl border border-[#333] bg-[#111] px-5 py-4 text-white text-base sm:text-lg placeholder-neutral-500 outline-none transition-all duration-200 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="rounded-xl bg-[#ff4444] px-8 py-4 text-base sm:text-lg font-bold text-white transition-all duration-200 hover:bg-[#ff5555] hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? "Summarizing..." : "Summarize"}
          </button>
        </motion.form>

        {/* Loading state */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-10 flex flex-col items-center gap-4"
            >
              {/* Pulse animation */}
              <div className="relative flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-2 border-red-500/30 animate-ping absolute" />
                <div className="h-8 w-8 rounded-full bg-red-500/20 animate-pulse flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                </div>
              </div>
              <p className="text-neutral-400 text-sm animate-pulse">
                {loadingMessages[loadingStage] || loadingMessages[0]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8 rounded-xl border border-red-500/30 bg-red-500/5 p-6"
            >
              <p className="text-red-400 font-medium mb-2">{error}</p>
              <p className="text-neutral-500 text-sm">
                Tips: Make sure the video has captions enabled, the URL is
                correct, and the video is publicly accessible.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              ref={resultRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mt-10 space-y-8"
            >
              {/* Video embed */}
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-[#222] shadow-2xl shadow-black/50">
                <iframe
                  src={`https://www.youtube.com/embed/${encodeURIComponent(result.videoId)}`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* TLDR */}
              <div className="rounded-xl border-l-4 border-red-500 bg-[#111] p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">
                  TLDR
                </h3>
                <p className="text-neutral-200 text-base sm:text-lg leading-relaxed">
                  {result.tldr}
                </p>
              </div>

              {/* Key Points */}
              {result.keyPoints && result.keyPoints.length > 0 && (
                <div className="rounded-xl bg-[#111] border border-[#222] p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-4">
                    Key Points
                  </h3>
                  <ul className="space-y-3">
                    {result.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                        <span className="text-neutral-300 leading-relaxed">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detailed Summary (collapsible) */}
              {result.detailedSummary && (
                <div className="rounded-xl bg-[#111] border border-[#222] overflow-hidden">
                  <button
                    onClick={() => setDetailsOpen(!detailsOpen)}
                    className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-[#161616]"
                  >
                    <h3 className="text-xs font-bold uppercase tracking-widest text-red-400">
                      Detailed Summary
                    </h3>
                    <svg
                      className={`h-5 w-5 text-neutral-500 transition-transform duration-300 ${
                        detailsOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <AnimatePresence initial={false}>
                    {detailsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6">
                          <div className="h-px bg-[#222] mb-5" />
                          <p className="text-neutral-300 leading-relaxed whitespace-pre-line">
                            {result.detailedSummary}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
