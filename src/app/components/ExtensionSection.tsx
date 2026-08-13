"use client";

import React from "react";
import { motion } from "framer-motion";
import { MousePointerClick, PanelRight, Languages, ShieldCheck } from "lucide-react";
import ChromeLogo from "./ChromeLogo";
import { CHROME_STORE_URL } from "@/lib/extension";

const perks = [
  {
    icon: MousePointerClick,
    title: "Seleziona e analizza",
    desc: "Evidenzia codice su qualsiasi pagina web e analizzalo senza copiare e incollare.",
  },
  {
    icon: PanelRight,
    title: "Pannello laterale AI",
    desc: "Spiegazioni, bug e codice corretto in un pannello sempre a portata di mano.",
  },
  {
    icon: Languages,
    title: "In italiano",
    desc: "Analisi e suggerimenti in italiano, pensati per capire davvero il codice.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy by design",
    desc: "L'estensione agisce solo quando la attivi: il tuo codice non viene mai salvato.",
  },
];

export default function ExtensionSection() {
  return (
    <section id="estensione" className="w-full py-16 md:py-20">
      <div className="container mx-auto px-6 md:px-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl px-6 py-14 md:px-16 md:py-20 text-center"
          style={{
            background: "linear-gradient(150deg, #0a0c10 0%, #10151d 55%, #0d1a16 100%)",
            border: "1px solid rgba(16,185,129,0.25)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
          }}
        >
          {/* Glow decorations */}
          <div
            className="absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-28 -right-24 w-[420px] h-[420px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(66,133,244,0.15) 0%, transparent 70%)" }}
          />

          <div className="relative z-10 max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border"
              style={{
                background: "rgba(16,185,129,0.1)",
                borderColor: "rgba(16,185,129,0.35)",
                color: "#34d399",
              }}
            >
              <ChromeLogo className="w-3.5 h-3.5" />
              Estensione Chrome
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: "rgba(66,133,244,0.2)", color: "#7db2ff" }}
              >
                In arrivo
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-5">
              Il tuo co-pilot AI,{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #34d399, #6ee7b7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ovunque scrivi codice
              </span>
            </h2>

            <p className="text-base md:text-lg text-[#94a3b8] max-w-2xl mx-auto leading-relaxed mb-10">
              Seleziona il codice su qualsiasi sito — GitHub, documentazione, Stack Overflow —
              e lascia che Semplycode lo analizzi, lo spieghi e lo corregga in un pannello laterale.
            </p>

            {/* Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left mb-10">
              {perks.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p.icon size={20} style={{ color: "#34d399" }} className="mb-2.5" />
                  <p className="text-sm font-semibold text-white mb-1">{p.title}</p>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 md:px-10 py-4 rounded-full text-base font-bold text-white transition-all duration-200 hover:scale-[1.04] hover:brightness-110 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #4285f4 0%, #3167c9 100%)",
                boxShadow: "0 0 40px rgba(66,133,244,0.35), 0 8px 24px rgba(0,0,0,0.3)",
              }}
            >
              <ChromeLogo className="w-5 h-5" />
              Aggiungi a Chrome
            </a>

            <p className="mt-5 text-xs text-[#64748b]">
              Gratis · Disponibile a breve sul Chrome Web Store · Attiva solo quando lo decidi tu
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
