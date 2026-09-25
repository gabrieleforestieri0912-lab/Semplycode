'use client';

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Pricing from "./components/Pricing";
import Footer from "./components/Footer";
import FAQ from "./components/FAQ";
import ImportCodeSection from "./components/ImportCodeSection";
import ExtensionSection from "./components/ExtensionSection";

const belowFoldLoaders = {
  HowItWorks: dynamic(() => import("./components/HowItWorks"), { ssr: true }),
  Features: dynamic(() => import("./components/Features"), { ssr: true }),
  ImportCodeSection: dynamic(() => import("./components/ImportCodeSection"), { ssr: true }),
  Pricing: dynamic(() => import("./components/Pricing"), { ssr: true }),
  ExtensionSection: dynamic(() => import("./components/ExtensionSection"), { ssr: true }),
  FAQ: dynamic(() => import("./components/FAQ"), { ssr: true }),
  Footer: dynamic(() => import("./components/Footer"), { ssr: true }),
};

const { HowItWorks: HowItWorksLazy, Features: FeaturesLazy, ImportCodeSection: ImportCodeSectionLazy, Pricing: PricingLazy, ExtensionSection: ExtensionSectionLazy, FAQ: FaqLazy, Footer: FooterLazy } = belowFoldLoaders;

const DemoSection = dynamic(() => import("./components/Demo"), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto -mt-8 md:-mt-16 mb-12 max-w-7xl 2xl:max-w-screen-2xl 3xl:max-w-[1720px] 4xl:max-w-[1920px]">
      <div className="w-full h-[400px] xs:h-[500px] md:h-[600px] rounded-3xl animate-pulse flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
      >
        <span className="text-[#475569]" style={{ fontFamily: "monospace" }}>Caricamento AI Core...</span>
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-white text-[#0f172a] overflow-x-hidden">
      <Navbar />

      <div className="grow">
        <Hero />

        <Suspense fallback={null}>
          <motion.div
            id="demo"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="container mx-auto max-w-7xl 2xl:max-w-screen-2xl 3xl:max-w-[1720px] 4xl:max-w-[1920px] pt-4 sm:pt-8 pb-4 md:pt-12 md:pb-6"
          >
            <DemoSection />
          </motion.div>
        </Suspense>

        <HowItWorksLazy />

        <FeaturesLazy />

        <ImportCodeSectionLazy />
        <PricingLazy />
        <ExtensionSectionLazy />
        <FaqLazy />
      </div>

      <FooterLazy />
    </div>
  );
}


