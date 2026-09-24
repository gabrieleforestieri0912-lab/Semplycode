"use client";

import React from "react";
import { motion } from "framer-motion";
import { MousePointerClick, PanelRight, Languages, ShieldCheck } from "lucide-react";
import ChromeLogo from "./ChromeLogo";
import {
  CHROME_STORE_URL,
  CHROME_BUTTON_CLASS,
  CHROME_BUTTON_STYLE,
} from "@/lib/extension";

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
    <section id="estensione" className="w-full py-16 md:py-24 3xl:py-32">
      <div className="container mx-auto max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] 4xl:max-w-[1800px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl px-4 sm:px-10 md:px-16 3xl:px-24 py-10 sm:py-14 md:py-20 3xl:py-28 text-center"
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

          <div className="relative z-10 max-w-3xl 3xl:max-w-5xl mx-auto">
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
            </div>

            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl 3xl:text-6xl font-black tracking-tight text-white mb-4 sm:mb-5">
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

            <p className="text-sm xs:text-base md:text-lg 3xl:text-xl text-[#94a3b8] max-w-2xl 3xl:max-w-4xl mx-auto leading-relaxed mb-8 sm:mb-10">
              Seleziona il codice su qualsiasi sito — GitHub, documentazione, Stack Overflow —
              e lascia che Semplycode lo analizzi, lo spieghi e lo corregga in un pannello laterale.
            </p>

            {/* Perks */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 3xl:gap-6 text-left mb-8 sm:mb-10">
              {perks.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl p-4 3xl:p-6"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p.icon size={20} style={{ color: "#34d399" }} className="mb-2.5" />
                  <p className="text-sm 3xl:text-base font-semibold text-white mb-1">{p.title}</p>
                  <p className="text-xs 3xl:text-sm text-[#94a3b8] leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex justify-center">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CHROME_BUTTON_CLASS} min-h-[48px] w-full xs:w-auto inline-flex items-center justify-center`}
                style={CHROME_BUTTON_STYLE}
              >
                <ChromeLogo className="w-5 h-5" />
                Aggiungi a Chrome
              </a>
            </div>

            <p className="mt-5 text-xs 3xl:text-sm text-[#64748b]">
              Gratis · Disponibile sul Chrome Web Store · Attiva solo quando lo decidi tu
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
