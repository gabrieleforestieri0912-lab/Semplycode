'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

const reasons = [
  {
    title: 'Capisci il "perché"',
    desc: "Non ti diamo solo codice funzionante. Ti spieghiamo ogni riga, così impari davvero come funziona.",
    accent: "#10b981",
  },
  {
    title: "Impari dal tuo codice",
    desc: "Usi il tuo codice come base per capire concetti nuovi. È come avere un tutor personale 24/7.",
    accent: "#60a5fa",
  },
  {
    title: "Codice che funziona davvero",
    desc: "Non affidarti a AI che generano codice casuale. Noi analizziamo il TUO codice e lo miglioriamo.",
    accent: "#a78bfa",
  },
  {
    title: "Sicuro e Privato",
    desc: "Il tuo codice non viene memorizzato. L'analisi è istantanea e il codice resta solo tuo.",
    accent: "#fb7185",
  },
];

const WhyChoose = () => {
  return (
    <section
      className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)" }}
        />
      </div>

      <div className="container mx-auto relative z-10 max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl">
        <div className="max-w-5xl 3xl:max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.25)",
                color: "#10b981",
              }}
            >
              <Sparkles size={11} />
              Perché Semplycode
            </div>
            <h2
              className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl 3xl:text-6xl font-black tracking-tight mb-4 text-[#0f172a]"
            >
              La differenza che conta
            </h2>
            <p className="text-sm xs:text-base sm:text-lg 3xl:text-xl max-w-xl 3xl:max-w-2xl mx-auto px-2 sm:px-0" style={{ color: "#475569" }}>
              In un mondo pieno di AI che scrivono codice da sole, noi facciamo qualcosa di diverso.
            </p>
          </motion.div>

          {/* Reasons grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 3xl:gap-8 mb-12">
            {reasons.map((reason, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -3 }}
                className="flex gap-4 rounded-2xl p-5 sm:p-6 3xl:p-8 transition-all duration-300"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <div className="shrink-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${reason.accent}18`, border: `1px solid ${reason.accent}30` }}
                  >
                    <Check size={16} style={{ color: reason.accent }} strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm xs:text-base 3xl:text-lg font-bold mb-1.5" style={{ color: "#0f172a" }}>
                    {reason.title}
                  </h3>
                  <p className="text-xs xs:text-sm 3xl:text-base leading-relaxed" style={{ color: "#64748b" }}>
                    {reason.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-5 sm:p-8 3xl:p-12 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.04))",
              border: "1px solid rgba(16,185,129,0.15)",
            }}
          >
            <p className="text-base sm:text-lg 3xl:text-xl font-medium mb-2" style={{ color: "#475569" }}>
              <span style={{ color: "#0f172a", fontWeight: 600 }}>Copilot, ChatGPT, Claude</span>{" "}
              <span style={{ color: "#475569" }}>scrivono codice al posto tuo.</span>
            </p>
            <p className="text-lg xs:text-xl sm:text-2xl 3xl:text-3xl font-bold" style={{ color: "#0f172a" }}>
              <span
                style={{
                  background: "linear-gradient(135deg, #10b981, #34d399)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Semplycode
              </span>{" "}
              ti insegna a farlo.
            </p>
            <p className="mt-4 text-xs xs:text-sm 3xl:text-base" style={{ color: "#475569" }}>
              La differenza tra un developer che usa AI e uno che la{" "}
              <span style={{ color: "#059669", fontWeight: 600 }}>capisce</span>?{" "}
              <span style={{ color: "#0f172a", fontWeight: 700 }}>Semplycode.</span>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;