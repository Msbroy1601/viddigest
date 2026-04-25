"use client";

import { Youtube, Mic, FileText } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Paste a Link",
    description:
      "Copy any YouTube video URL and paste it into VidDigest. Shorts, lectures, podcasts, tutorials — anything works.",
    icon: Youtube,
  },
  {
    number: "02",
    title: "AI Transcribes",
    description:
      "We extract the transcript in 50+ languages automatically. No manual uploads, no waiting — it just works.",
    icon: Mic,
  },
  {
    number: "03",
    title: "Get Your Summary",
    description:
      "Receive a TLDR, key takeaways, and a detailed summary — structured and ready to use in seconds.",
    icon: FileText,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#0a0a0a] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-4"
        >
          How It Works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-gray-400 text-center mb-14 max-w-2xl mx-auto"
        >
          Three simple steps to turn any YouTube video into a concise, structured summary.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="group relative rounded-xl border border-[#333] bg-[#1a1a1a] p-6 sm:p-8 transition-all duration-300 hover:border-[#ff4444]/40 hover:shadow-[0_0_30px_rgba(255,68,68,0.08)]"
              >
                <span className="absolute top-4 right-4 text-sm font-mono font-bold text-[#ff4444]/60">
                  {step.number}
                </span>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff4444]/10">
                  <Icon className="h-6 w-6 text-[#ff4444]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
