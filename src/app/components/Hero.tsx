"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSupabaseSession } from "@/lib/auth";
import { ArrowRight, AlertTriangle } from "lucide-react";
import CodeFloatBackground from "./CodeFloatBackground";

const Hero = () => {
  const { status } = useSupabaseSession();

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
            background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.06) 40%, transparent 68%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute top-1/2 right-[-80px] w-[360px] h-[360px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* Background codice fluttuante (decorativo, aria-hidden) */}
      <CodeFloatBackground />

      <div className="container mx-auto relative z-10 max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1400px]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-0">
          {/* Headline - fix doppio spazio "combattere con" */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[clamp(1.9rem,5vw,5.5rem)] 3xl:text-[6rem] 4xl:text-[7rem] font-black tracking-tight mb-5 sm:mb-6 md:mb-8 leading-[1.1] relative text-[#0f172a]"
          >
            <span className="relative z-[1]">Smetti di combattere con il codice.</span>
            <br />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontStyle: "italic",
                position: "relative",
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
            Semplycode scompone la logica complessa, trova i bug istantaneamente e ti insegna a scrivere codice migliore con
            spiegazioni AI in tempo reale.
          </motion.p>

          {/* CTA: una primaria + un link secondario (H1: Aggiungi a Chrome rimosso; H2: Prova Chat AI rimosso) */}
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

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => document.getElementById('come-funziona')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full xs:w-auto min-w-[200px] sm:min-w-[200px] inline-flex items-center justify-center gap-1.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-sm sm:text-[15px] font-semibold border border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f8fafc] hover:border-emerald-200 hover:text-emerald-700 shadow-sm transition-all"
            >
              Vedi come funziona
              <ArrowRight size={14} className="opacity-60" />
            </motion.button>
          </motion.div>

          {/* Social proof - fatti veri senza glifo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm 3xl:text-base"
            style={{ color: "#475569" }}
          >
            <span>In italiano</span>
            <span className="text-[#94a3b8]">·</span>
            <span>20+ linguaggi</span>
            <span className="text-[#94a3b8]">·</span>
            <span>piano gratuito con 10 analisi al giorno</span>
          </motion.div>
        </div>

        {/* Visual centrale: esempio reale statico - snippet con bug, riga evidenziata, spiegazione, fix diff */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="mt-10 sm:mt-14 max-w-[720px] mx-auto px-4 sm:px-0"
        >
          <div className="rounded-2xl sm:rounded-3xl border border-[#e2e8f0] bg-white shadow-xl shadow-black/[0.06] overflow-hidden text-left">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#e2e8f0] bg-[#f8fafc]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-mono font-semibold text-[#475569]">calcolaTotale.js</span>
              </div>
              <span className="text-[11px] font-bold tracking-widest uppercase px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                JavaScript
              </span>
            </div>

            {/* Code snippet con riga evidenziata */}
            <div className="bg-[#0f172a] px-0 py-0 overflow-x-auto">
              <pre className="text-[12px] sm:text-[13px] leading-[1.7] font-mono m-0 p-4 sm:p-5">
                <code>
                  <span className="text-slate-500 select-none inline-block w-6 text-right mr-3">1</span>
                  <span className="text-slate-300">function </span>
                  <span className="text-emerald-300">calcolaTotale</span>
                  <span className="text-slate-300">(carrello) {"{"}</span>
                  {"\n"}
                  <span className="text-slate-500 select-none inline-block w-6 text-right mr-3">2</span>
                  <span className="text-slate-300">  let totale = 0;</span>
                  {"\n"}
                  <span className="flex items-center -mx-4 sm:-mx-5 px-4 sm:px-5 bg-red-500/15 border-l-[3px] border-red-500">
                    <span className="text-slate-500 select-none inline-block w-6 text-right mr-3">3</span>
                    <span className="text-slate-100">  for (let i = 0; i </span>
                    <span className="bg-red-500/30 text-red-200 px-1 rounded">&lt;= carrello.length</span>
                    <span className="text-slate-100">; i++) {"{"}</span>
                    <span className="ml-auto pl-3 flex items-center gap-1 text-[11px] font-sans font-semibold text-red-300">
                      <AlertTriangle size={12} /> bug
                    </span>
                  </span>
                  {"\n"}
                  <span className="text-slate-500 select-none inline-block w-6 text-right mr-3">4</span>
                  <span className="text-slate-300">    totale += carrello[i].prezzo;</span>
                  {"\n"}
                  <span className="text-slate-500 select-none inline-block w-6 text-right mr-3">5</span>
                  <span className="text-slate-300">  {"}"}</span>
                  {"\n"}
                  <span className="text-slate-500 select-none inline-block w-6 text-right mr-3">6</span>
                  <span className="text-slate-300">  return totale;</span>
                  {"\n"}
                  <span className="text-slate-500 select-none inline-block w-6 text-right mr-3">7</span>
                  <span className="text-slate-300">{"}"}</span>
                </code>
              </pre>
            </div>

            {/* Spiegazione in italiano */}
            <div className="px-4 sm:px-5 py-4 bg-amber-50/70 border-y border-amber-200/60">
              <p className="text-xs font-bold tracking-widest uppercase text-amber-700 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={13} /> Perché è un bug
              </p>
              <p className="text-sm leading-relaxed text-[#334155]">
                La condizione <code className="px-1.5 py-0.5 rounded bg-white border border-amber-200 text-amber-800 font-mono text-xs">&lt;=</code> fa
                accedere a <code className="px-1.5 py-0.5 rounded bg-white border border-amber-200 text-amber-800 font-mono text-xs">carrello[carrello.length]</code> che è <code className="px-1.5 py-0.5 rounded bg-white border border-amber-200 text-amber-800 font-mono text-xs">undefined</code>. Alla
                riga 4 <code className="font-mono text-xs">undefined.prezzo</code> lancia <span className="font-semibold">TypeError</span> e il totale diventa <code className="font-mono text-xs">NaN</code>.
              </p>
            </div>

            {/* Fix in diff */}
            <div className="px-4 sm:px-5 py-4 bg-[#f8fafc]">
              <p className="text-xs font-bold tracking-widest uppercase text-emerald-700 mb-2">Fix proposto</p>
              <pre className="text-[12px] sm:text-[13px] leading-[1.7] font-mono rounded-xl overflow-hidden border border-[#e2e8f0] bg-white">
                <code>
                  <span className="block px-3 sm:px-4 py-1 bg-red-50 text-red-700 border-l-[3px] border-red-400">
                    <span className="text-red-400 select-none mr-2">−</span>for (let i = 0; i &lt;= carrello.length; i++) {"{"}
                  </span>
                  <span className="block px-3 sm:px-4 py-1 bg-emerald-50 text-emerald-700 border-l-[3px] border-emerald-500">
                    <span className="text-emerald-500 select-none mr-2">+</span>for (let i = 0; i &lt; carrello.length; i++) {"{"}
                  </span>
                </code>
              </pre>
              <p className="mt-2.5 text-xs text-[#64748b]">Basta sostituire <span className="font-mono">&lt;=</span> con <span className="font-mono">&lt;</span>: l&apos;indice resta nell&apos;intervallo valido 0 … length-1.</p>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-[#94a3b8]">Esempio reale · rilevato da Semplycode in italiano con spiegazione e diff correttivo</p>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
