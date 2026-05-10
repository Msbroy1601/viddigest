"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "Is VidDigest really free?",
    answer:
      "Yes, 100% free. We use multiple AI providers (Groq, Gemini, OpenRouter) so the service stays reliable.",
  },
  {
    question: "What languages are supported?",
    answer:
      "50+ languages including Hindi, Bengali, Spanish, French, Japanese, Korean, and more. Summaries are always in English.",
  },
  {
    question: "How long can the videos be?",
    answer:
      "Any length — from 30-second shorts to 10+ hour lectures.",
  },
  {
    question: "How does it work?",
    answer:
      "We extract the video's captions, then use AI to generate a structured summary. Our system tries multiple providers to ensure reliability.",
  },
  {
    question: "What if a video has no captions?",
    answer:
      "We fall back to automatic subtitle extraction. Music videos or videos with no speech can't be summarized.",
  },
  {
    question: "Is my data stored?",
    answer:
      "No. We don't store any videos, transcripts, or summaries.",
  },
];

function FAQItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      viewport={{ once: true }}
      className="border-b border-[#222]"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-white"
      >
        <span className="text-base sm:text-lg font-medium text-gray-200">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-[#ff4444] transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="bg-[#0a0a0a] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-12"
        >
          Frequently Asked Questions
        </motion.h2>

        <div className="divide-y divide-[#222] border-t border-[#222]">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
