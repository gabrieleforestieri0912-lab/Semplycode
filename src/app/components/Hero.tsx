"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSupabaseSession } from "@/lib/auth";
import { ArrowRight } from "lucide-react";
import ChromeLogo from "./ChromeLogo";
import CodeFloatBackground from "./CodeFloatBackground";
import { CHROME_STORE_URL } from "@/lib/extension";

const Hero = () => {
  const { user: sessionUser, status } = useSupabaseSession();

  const handleMainButtonClick = () => {
    window.location.href = status === "authenticated" ? "/chat" : "/login";
  };

  return (
    <section className="relative pt-14 sm:pt-20 md:pt-28 lg:pt-32 pb-14 sm:pb-20 md:pb-24 lg:pb-32 overflow-hidden">
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

      {/* Background codice fluttuante (decorativo, aria-hidden) */}
      <CodeFloatBackground />

       <div className="container mx-auto relative z-10 max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1400px]">
         <div className="max-w-4xl mx-auto text-center">

           {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[clamp(1.9rem,5vw,5.5rem)] 3xl:text-[6rem] 4xl:text-[7rem] font-black tracking-tight mb-5 sm:mb-6 md:mb-8 leading-[1.1] relative text-[#0f172a]"
            >
              <span className="relative z-[1]">Smetti di combattere</span>
              <br className="hidden sm:block" />
              <span className="relative z-[1]"> con il codice.{" "}</span>
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
            className="text-sm sm:text-base md:text-lg lg:text-xl mb-8 sm:mb-10 md:mb-12 max-w-2xl 3xl:max-w-3xl mx-auto leading-relaxed text-[#64748b]"
          >
            Semplycode scompone la logica complessa, trova i bug istantaneamente
            e ti insegna a scrivere codice migliore con spiegazioni AI in tempo reale.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col xs:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-3xl mx-auto w-full"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleMainButtonClick}
              className="w-full xs:w-auto min-w-[200px] sm:min-w-[240px] inline-flex items-center justify-center gap-2.5 sm:gap-3 px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                boxShadow: "0 0 40px rgba(16,185,129,0.35), 0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              Prova Gratis
              <ArrowRight size={16} />
            </motion.button>

            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full xs:w-auto min-w-[200px] sm:min-w-[240px] inline-flex items-center justify-center gap-2.5 sm:gap-3 px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-bold text-white transition-all duration-200 hover:scale-[1.04] hover:bg-[#1e293b] active:scale-95"
              style={{
                background: "#0f172a",
                boxShadow: "0 0 40px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.25)",
              }}
            >
              <ChromeLogo className="w-5 h-5" />
              Aggiungi a Chrome
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm 3xl:text-base"
            style={{ color: "#475569" }}
          >
            <span className="flex items-center gap-1.5">
              <span style={{ color: "#10b981" }}>✦</span> In italiano
            </span>
            <span className="text-[#475569] hidden xs:inline">·</span>
            <span className="flex items-center gap-1.5">
              <span style={{ color: "#10b981" }}>✦</span> 20+ linguaggi
            </span>
            <span className="text-[#475569] hidden xs:inline">·</span>
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
