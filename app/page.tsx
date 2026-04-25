import { Hero, HowItWorks, Summarizer, FAQ, Footer } from "@/components/sections";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-black">
      <Hero />
      <HowItWorks />
      <Summarizer />
      <FAQ />
      <Footer />
    </main>
  );
}
