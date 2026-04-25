"use client";

import React from "react";
import { motion } from "framer-motion";
import { SparklesCore } from "@/components/ui/sparkles";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
};

const badges = ["Free", "50+ Languages", "Powered by AI"];

export function Hero() {
  const scrollToSummarizer = () => {
    const el = document.getElementById("summarizer");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black flex items-center justify-center">
      {/* Particle background */}
      <div className="absolute inset-0 w-full h-full">
        <SparklesCore
          id="hero-sparkles"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={80}
          className="h-full w-full"
          particleColor="#ff4444"
          speed={0.8}
        />
      </div>

      {/* Radial vignette overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_black_70%)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Title */}
        <motion.h1
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-none"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-neutral-400">
            Vid
          </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-red-400 via-red-500 to-red-700">
            Digest
          </span>
        </motion.h1>

        {/* Glowing red line */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-6 w-full max-w-lg"
        >
          <div className="relative h-px w-full">
            {/* Outer glow */}
            <div className="absolute inset-0 blur-sm bg-gradient-to-r from-transparent via-red-500 to-transparent" />
            {/* Core line */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400 to-transparent" />
            {/* Bright center bloom */}
            <div className="absolute -inset-y-1 inset-x-0 blur-md bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-8 text-lg sm:text-xl md:text-2xl text-neutral-400 font-light max-w-xl leading-relaxed"
        >
          Summarize any YouTube video in seconds
        </motion.p>

        {/* Badges */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          {badges.map((badge, i) => (
            <React.Fragment key={badge}>
              <span className="rounded-full border border-neutral-700/60 bg-neutral-900/60 px-4 py-1.5 text-xs sm:text-sm text-neutral-300 backdrop-blur-sm">
                {badge}
              </span>
              {i < badges.length - 1 && (
                <span className="hidden sm:inline text-neutral-600 text-xs select-none">
                  &bull;
                </span>
              )}
            </React.Fragment>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-10"
        >
          <button
            onClick={scrollToSummarizer}
            className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-red-500 px-8 py-3.5 text-base sm:text-lg font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:shadow-red-500/40 hover:scale-105 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            {/* Glow behind button */}
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-red-600 to-red-400 opacity-0 blur transition-opacity duration-300 group-hover:opacity-30" />
            <span className="relative">Try It Free</span>
            <span className="relative transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </button>
        </motion.div>
      </div>

      {/* Bottom fade for seamless section transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  );
}
