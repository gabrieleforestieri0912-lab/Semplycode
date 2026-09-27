"use client";

import React from "react";
import { motion } from "framer-motion";
import { MousePointerClick, PanelRight, Languages, ShieldCheck, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import ChromeLogo from "./ChromeLogo";

export default function ExtensionSection() {
  const { language } = useLanguage();
  const t = {
    it: {
      badge: "In arrivo — Estensione Chrome",
      titleA: "Il tuo co-pilot AI,",
      titleB: "ovunque scrivi codice",
      subtitle:
        "Seleziona il codice su qualsiasi sito — GitHub, documentazione, Stack Overflow — e lascialo analizzare in un pannello laterale. La pubblicazione sul Chrome Web Store è in preparazione.",
      perks: [
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
          title: "Privacy chiara",
          desc: "Il codice analizzato dall’estensione non viene salvato di default; solo il report che decidi di condividere dalla Chat AI genera un link temporaneo (7 giorni).",
        },
      ],
      ctaTitle: "Estensione non ancora pubblicata — nessun ID valido nello Store (src/lib/extension.ts)",
      cta: "In arrivo sul Chrome Web Store",
      noteA: "Nessun link attivo finché la listing non sarà pubblicata",
      noteB: "Gratuita quando disponibile · Si attiva solo quando la apri tu",
      noteC: "Condividere un link al report è diverso: lo crei esplicitamente dalla Chat AI e scade in 7 giorni (",
      noteD: ") — non è salvataggio automatico.",
    },
    en: {
      badge: "Coming soon — Chrome Extension",
      titleA: "Your AI co-pilot,",
      titleB: "wherever you write code",
      subtitle:
        "Select code on any site — GitHub, docs, Stack Overflow — and have it analyzed in a side panel. Publishing to the Chrome Web Store is in preparation.",
      perks: [
        {
          icon: MousePointerClick,
          title: "Select and analyze",
          desc: "Highlight code on any web page and analyze it without copy-pasting.",
        },
        {
          icon: PanelRight,
          title: "AI side panel",
          desc: "Explanations, bugs and fixed code in a panel always at hand.",
        },
        {
          icon: Languages,
          title: "In English",
          desc: "Analyses and suggestions in English, designed to truly understand code.",
        },
        {
          icon: ShieldCheck,
          title: "Clear privacy",
          desc: "Code analyzed by the extension is not saved by default; only the report you choose to share from Chat AI generates a temporary link (7 days).",
        },
      ],
      ctaTitle: "Extension not yet published — no valid ID in the Store (src/lib/extension.ts)",
      cta: "Coming soon to the Chrome Web Store",
      noteA: "No active link until the listing is published",
      noteB: "Free when available · It only activates when you open it",
      noteC: "Sharing a report link is different: you explicitly create it from Chat AI and it expires in 7 days (",
      noteD: ") — not automatic saving.",
    },
  }[language];
  const perks = t.perks;

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
            {/* Badge — In arrivo, non cliccabile */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border"
              style={{
                background: "rgba(251,191,36,0.12)",
                borderColor: "rgba(251,191,36,0.35)",
                color: "#fbbf24",
              }}
            >
              <Clock size={12} />
              {t.badge}
            </div>

            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl 3xl:text-6xl font-black tracking-tight text-white mb-4 sm:mb-5">
              {t.titleA}{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #34d399, #6ee7b7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t.titleB}
              </span>
            </h2>

            <p className="text-sm xs:text-base md:text-lg 3xl:text-xl text-[#94a3b8] max-w-2xl 3xl:max-w-4xl mx-auto leading-relaxed mb-8 sm:mb-10">
              {t.subtitle}
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

            {/* CTA — In arrivo, senza link cliccabile (Sezione 0: listing non pubblicata, URL in src/lib/extension.ts senza ID valido) */}
            <div className="flex justify-center">
              <span
                aria-disabled="true"
                className="min-h-[48px] w-full xs:w-auto inline-flex items-center justify-center gap-3 px-8 md:px-10 py-4 rounded-full text-base font-bold text-white/60 cursor-not-allowed"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "none",
                }}
                title={t.ctaTitle}
              >
                <ChromeLogo className="w-5 h-5 opacity-60" />
                {t.cta}
              </span>
            </div>

            <p className="mt-5 text-xs 3xl:text-sm text-[#64748b] leading-relaxed max-w-2xl mx-auto">
              <span className="text-[#94a3b8]">{t.noteA}</span>
              {" · "}
              {t.noteB}
              <br />
              <span className="text-[#475569] text-[11px]">{t.noteC}<span className="font-mono">src/app/api/share/route.ts:7</span>{t.noteD}</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
