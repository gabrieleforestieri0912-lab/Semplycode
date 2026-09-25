'use client';

import React from 'react';
import { Brain, Languages, Zap, FileCode, Upload, Check, Copy, Share2, Bookmark, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const Features = () => {
  return (
    <section
      id="funzionalita"
      className="relative py-20 md:py-28 lg:py-32 overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto relative z-10 max-w-7xl 2xl:max-w-screen-2xl 3xl:max-w-[1720px] 4xl:max-w-[1920px]">
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 relative"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-15" />
            <span className="absolute inset-px rounded-full bg-white" />
            <Brain size={11} className="relative text-emerald-500" />
            <span className="relative text-emerald-600">Funzionalità</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[clamp(1.75rem,4vw,4rem)] 3xl:text-[4.5rem] font-black tracking-tight text-[#0f172a] mb-4 sm:mb-5"
          >
            Tutto ciò che ti serve{" "}
            <span className="text-gradient">per migliorare il codice</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg md:text-xl text-[#475569] max-w-2xl mx-auto px-2 sm:px-0"
          >
            Report in italiano, caricamento multi-file reale e focus a scelta — senza claim non verificabili.
          </motion.p>
        </div>

        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          {/* BLOCCO 1: Report strutturato - testo a sinistra, UI a destra */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative rounded-3xl border border-[#e2e8f0] bg-white overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-900/10 transition-all"
          >
            <div className="grid lg:grid-cols-2">
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.18)' }}>
                  <Brain size={22} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-3">Report strutturato in italiano</h3>
                <p className="text-sm sm:text-[15px] leading-relaxed text-[#475569] mb-5">
                  Ogni analisi produce — per il linguaggio rilevato — <span className="font-semibold text-[#0f172a]">Errori</span> con riga citata quando il codice supera 50 righe, <span className="font-semibold text-[#0f172a]">Spiegazione</span> causa-effetto e <span className="font-semibold text-[#0f172a]">Codice corretto</span>. In modalità Correzione solo fix minimi; in Revisione anche DRY, naming e sicurezza.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'Riga citata se >50 righe e correlazione con stack trace se fornito',
                    'Spiegazione in italiano semplice, senza gergo',
                    'Snippet corretto copiabile con evidenza diff',
                  ].map((t) => (
                    <li key={t} className="flex gap-2.5 text-sm text-[#334155]">
                      <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <span className="leading-snug">{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-[#94a3b8]">Prompt verificabile in <span className="font-mono">src/lib/analysisPrompts.ts:8</span></p>
              </div>

              {/* UI reale: mini report */}
              <div className="bg-[#f8fafc] border-t lg:border-t-0 lg:border-l border-[#e2e8f0] p-6 sm:p-8 flex flex-col justify-center">
                <div className="rounded-2xl border border-[#e2e8f0] bg-white overflow-hidden shadow-sm text-left">
                  <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-[#475569]">report.md</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold tracking-widest uppercase">Italiano</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
                      <p className="text-xs font-bold text-red-700 flex items-center gap-1.5"><AlertTriangle size={12} /> Errori Trovati — riga 3</p>
                      <p className="text-xs text-red-600 mt-1 leading-relaxed">Off-by-one: <span className="font-mono">i &lt;= length</span> → <span className="font-mono">undefined.prezzo</span></p>
                    </div>
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                      <p className="text-xs font-bold text-amber-700">Spiegazione</p>
                      <p className="text-xs text-[#475569] mt-1 leading-relaxed">L’indice esce dai limiti dell’array; l’ultima iterazione legge fuori range.</p>
                    </div>
                    <div className="rounded-xl border border-[#e2e8f0] overflow-hidden">
                      <div className="px-3 py-2 bg-[#0f172a] text-[11px] font-mono flex items-center gap-2 text-slate-400"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Codice corretto — diff</div>
                      <div className="font-mono text-xs">
                        <div className="px-3 py-1.5 bg-red-50 text-red-700 border-l-[3px] border-red-400"><span className="text-red-400 mr-2">−</span>for (i = 0; i &lt;= len; i++)</div>
                        <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border-l-[3px] border-emerald-500"><span className="text-emerald-500 mr-2">+</span>for (i = 0; i &lt; len; i++)</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-[#94a3b8]">Anteprima report reale — non mock generico</p>
              </div>
            </div>
          </motion.div>

          {/* BLOCCO 2: Caricamento reale - UI a sinistra, testo a destra (alternato) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="group relative rounded-3xl border border-[#e2e8f0] bg-white overflow-hidden shadow-sm hover:shadow-xl hover:shadow-violet-900/10 transition-all"
          >
            <div className="grid lg:grid-cols-2">
              {/* UI a sinistra su desktop */}
              <div className="order-2 lg:order-1 bg-[#0a0c10] p-6 sm:p-8 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)' }} />
                <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-4">
                  <div className="flex items-center gap-2 text-white/90 text-xs font-semibold mb-3"><Upload size={14} className="text-violet-400" /> Trascina fino a 5 file</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'app.ts', lang: 'typescript', ok: true },
                      { name: 'utils.py', lang: 'python', ok: true },
                      { name: 'query.sql', lang: 'sql', ok: true },
                      { name: 'archive.zip', lang: 'ZIP · Pro', ok: false },
                    ].map((f) => (
                      <div key={f.name} className={`rounded-xl border px-3 py-2.5 flex items-center gap-2 ${f.ok ? 'bg-white text-[#0f172a] border-[#e2e8f0]' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'}`}>
                        <FileCode size={16} className={f.ok ? 'text-[#64748b]' : 'text-amber-400'} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate leading-none">{f.name}</p>
                          <p className="text-[10px] opacity-60">{f.lang}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-white/50">JS, TS, Python, Java, Go, Rust… • 100KB per file</span>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-white text-[#0f172a] font-bold">Max 5 file</span>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-white/40">Limite reale verificabile in <span className="font-mono text-white/60">planLimits.ts</span> e widget sotto</p>
              </div>

              <div className="order-1 lg:order-2 p-6 sm:p-8 lg:p-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.18)' }}>
                  <Upload size={22} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-3">Incolla, trascina o importa — fino a 5 file</h3>
                <p className="text-sm sm:text-[15px] leading-relaxed text-[#475569] mb-5">
                  Editor CodeMirror, drag-and-drop fino a <span className="font-semibold text-[#0f172a]">5 file da 100 KB</span> (<span className="font-semibold text-[#0f172a]">20 su Enterprise</span>), ZIP sbloccato su Pro/Enterprise e import da GitHub su Starter/Pro/Enterprise. Rilevamento linguaggio automatico.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'Fino a 5 file (20 su Enterprise) — risolta contraddizione “500 file”',
                    'ZIP consentito solo su Pro/Enterprise (allowZip)',
                    'GitHub consentito da Starter in su (allowGithub)',
                  ].map((t) => (
                    <li key={t} className="flex gap-2.5 text-sm text-[#334155]">
                      <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <span className="leading-snug">{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-[#94a3b8]">Valori reali in <span className="font-mono">src/lib/planLimits.ts:54</span> e <span className="font-mono">src/app/components/ImportCodeSection.tsx:15</span></p>
              </div>
            </div>
          </motion.div>

          {/* BLOCCO 3: Focus e portabilità - testo a sinistra, UI a destra */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="group relative rounded-3xl border border-[#e2e8f0] bg-white overflow-hidden shadow-sm hover:shadow-xl hover:shadow-teal-900/10 transition-all"
          >
            <div className="grid lg:grid-cols-2">
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(20,184,166,0.12)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.18)' }}>
                  <Zap size={22} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-3">Focus a scelta e risultato portabile</h3>
                <p className="text-sm sm:text-[15px] leading-relaxed text-[#475569] mb-5">
                  Scegli <span className="font-semibold text-[#0f172a]">Correzione</span>, <span className="font-semibold text-[#0f172a]">Revisione</span> o <span className="font-semibold text-[#0f172a]">Creazione</span> — in Revisione con sotto-focus Sicurezza/Performance/Stile — e riparti con codice applicabile.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'Sicurezza: injection, XSS, secret esposti, auth debole (non CVE generico)',
                    'Performance: loop, query, allocazioni con suggerimenti concreti (non “misurati”)',
                    'Export Markdown/codice, link condivisibile e salvataggio nel Cassetto Leitner',
                  ].map((t) => (
                    <li key={t} className="flex gap-2.5 text-sm text-[#334155]">
                      <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(20,184,166,0.12)', color: '#14b8a6' }}>
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <span className="leading-snug">{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-[#94a3b8]">Focus reali in <span className="font-mono">src/lib/analysisPrompts.ts:84</span> • Nessuna “collaborazione realtime”</p>
              </div>

              <div className="bg-[#f8fafc] border-t lg:border-t-0 lg:border-l border-[#e2e8f0] p-6 sm:p-8 flex flex-col justify-center gap-4">
                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold tracking-widest uppercase text-[#64748b] mb-3">Tipo di analisi</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white">Correzione</span>
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#e2e8f0] text-[#475569]">Revisione</span>
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#e2e8f0] text-[#475569]">Creazione</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">Sicurezza</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Performance</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">Stile</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0f172a] text-white text-xs font-semibold"><Copy size={13} /> Copia</span>
                  <span className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-[#e2e8f0] text-[#0f172a] text-xs font-semibold"><Share2 size={13} /> Condividi</span>
                  <span className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-[#e2e8f0] text-[#0f172a] text-xs font-semibold"><Bookmark size={13} /> Salva</span>
                </div>
                <p className="text-center text-xs text-[#94a3b8]">Azioni reali: copia/diff, export, share, Cassetto</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Features;
