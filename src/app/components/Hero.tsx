"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSupabaseSession } from "@/lib/auth";
import { ArrowRight, Play, Sparkles } from "lucide-react";

const Hero = () => {
  const { user: sessionUser, status } = useSupabaseSession();

  const handleMainButtonClick = () => {
    window.location.href = status === "authenticated" ? "/chat" : "/login";
  };

  return (
    <section className="relative pt-16 md:pt-28 pb-16 md:pb-24 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2 }}
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)",
          }}
        />
      </div>

       <div className="container mx-auto px-6 md:px-12 relative z-10">
         <div className="max-w-4xl mx-auto text-center">

           {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl xs:text-5xl md:text-7xl font-black tracking-tight mb-6 md:mb-8 leading-[1.08] relative"
            >
              <span style={{ color: "#0f172a", position: 'relative', zIndex: 1 }}>Smetti di combattere</span>
              <br className="hidden sm:block" />
              <span style={{ color: "#0f172a", position: 'relative', zIndex: 1 }}>con il codice.{" "}</span>
             <motion.span
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 1, delay: 0.7 }}
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontStyle: "italic",
                  position: 'relative',
                  zIndex: 1,
                  display: "inline-block",
                }}
             >
               Inizia a capirlo.
             </motion.span>
           </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-base xs:text-lg md:text-xl mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0"
            style={{ color: "#64748b" }}
          >
            Semplycode scompone la logica complessa, trova i bug istantaneamente
            e ti insegna a scrivere codice migliore con spiegazioni AI in tempo reale.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleMainButtonClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-base font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                boxShadow: "0 0 40px rgba(16,185,129,0.35), 0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              Prova Gratis
              <ArrowRight size={16} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold transition-all"
              style={{
                background: "rgba(0,0,0,0.03)",
                border: "1px solid rgba(0,0,0,0.08)",
                color: "#475569",
              }}
            >
              <Play size={15} fill="currentColor" />
              Guarda Demo
            </motion.button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 flex items-center justify-center gap-6 text-sm"
            style={{ color: "#475569" }}
          >
            <span className="flex items-center gap-1.5">
              <span style={{ color: "#10b981" }}>✦</span> 10K+ sviluppatori
            </span>
            <span style={{ color: "#1e293b" }}>·</span>
            <span className="flex items-center gap-1.5">
              <span style={{ color: "#10b981" }}>✦</span> 20+ linguaggi
            </span>
            <span style={{ color: "#1e293b" }}>·</span>
            <span className="flex items-center gap-1.5">
              <span style={{ color: "#10b981" }}>✦</span> Gratis per sempre
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
