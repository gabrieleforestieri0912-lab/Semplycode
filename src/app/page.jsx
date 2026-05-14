'use client';

import dynamic from "next/dynamic";
import { Suspense } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import WhyChoose from "./components/WhyChoose";
import HowItWorks from "./components/HowItWorks";
import Pricing from "./components/Pricing";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import ChromeExtensionCTA from "./components/ChromeExtensionCTA";

const DemoSection = dynamic(() => import("./components/Demo"), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-4 md:px-6 -mt-8 md:-mt-16 mb-12">
      <div className="w-full h-[500px] md:h-[600px] bg-gray-100 rounded-3xl animate-pulse flex items-center justify-center">
        <span className="text-gray-400 font-mono">Caricamento AI Core...</span>
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans selection:bg-primary/20">
      <Navbar />

      <main className="grow">
        <Hero />

        <Suspense fallback={null}>
          <div className="container mx-auto px-4 md:px-6 -mt-8 md:-mt-16 mb-12">
            <DemoSection />
          </div>
        </Suspense>

        <HowItWorks />

        <ChromeExtensionCTA />

        <Features />
        <WhyChoose />
        <Pricing />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
