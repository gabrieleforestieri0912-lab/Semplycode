'use client';

import dynamic from "next/dynamic";
import { Suspense, useState, useRef } from "react";
import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Pricing from "./components/Pricing";
import Footer from "./components/Footer";
import FAQ from "./components/FAQ";
import ImportCodeSection from "./components/ImportCodeSection";
import ExtensionSection from "./components/ExtensionSection";

const DemoSection = dynamic(() => import("./components/Demo"), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-4 md:px-6 -mt-8 md:-mt-16 mb-12">      <div className="w-full h-[500px] md:h-[600px] rounded-3xl animate-pulse flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
      >
        <span className="text-[#475569]" style={{ fontFamily: "monospace" }}>Caricamento AI Core...</span>
      </div>
    </div>
  )
});

interface Particle {
  id: number;
  left: number;
  top: number;
  x: number;
  y: number;
  size: number;
  duration: number;
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-white text-[#0f172a]">
      <Navbar />

      <main className="grow">
        <Hero />

        <Suspense fallback={null}>
          <motion.div
            id="demo"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="container mx-auto px-6 md:px-12 pt-8 pb-4 md:pt-12 md:pb-6"
          >
            <DemoSection />
          </motion.div>
        </Suspense>

        <div className="flex justify-center pt-4 md:pt-6 pb-12 md:pb-16">
          <MagneticPlaygroundButton />
        </div>

        <HowItWorks />

        <Features />

        <ImportCodeSection />
        <Pricing />
        <ExtensionSection />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}

function MagneticPlaygroundButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buttonClass = "relative flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-2xl shadow-emerald-500/30 border border-white/10 overflow-visible transition-all group-hover:shadow-emerald-500/50 group-hover:scale-[1.03]";

  const createParticle = (): Particle => {
    const side = Math.floor(Math.random() * 4);
    let left = 0, top = 0;

    if (side === 0) {
      left = Math.random() * 100;
      top = 0;
    } else if (side === 1) {
      left = 100;
      top = Math.random() * 100;
    } else if (side === 2) {
      left = Math.random() * 100;
      top = 100;
    } else {
      left = 0;
      top = Math.random() * 100;
    }

    const centerX = 50;
    const centerY = 50;
    const angle = Math.atan2(top - centerY, left - centerX);
    const distance = 70 + Math.random() * 55;

    return {
      id: Date.now() + Math.random(),
      left,
      top,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: Math.random() * 3.5 + 2.8,
      duration: 0.6 + Math.random() * 0.4,
    };
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setParticles([]);

    intervalRef.current = setInterval(() => {
      setParticles(prev => {
        let updated = [...prev];

        for (let i = 0; i < 3; i++) {
          updated.push(createParticle());
        }

        if (updated.length > 38) {
          updated = updated.slice(updated.length - 38);
        }
        return updated;
      });
    }, 65);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimeout(() => {
      setParticles([]);
    }, 700);
  };

  return (
    <Link href="/chat" className="group inline-block">
      <div
        className={buttonClass}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                opacity: 0.85,
                scale: 1,
              }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: 0,
                scale: 0.2,
              }}
              transition={{
                duration: p.duration,
                ease: "easeOut",
              }}
              className="absolute w-2 h-2 rounded-full pointer-events-none z-[-1]"
              style={{
                background: "#34d399",
                boxShadow: "0 0 8px #10b981",
              }}
            />
          ))}
        </AnimatePresence>

        <Play className="w-5 h-5" />
        <span>Prova Chat AI</span>
        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
      </div>
    </Link>
  );
}


