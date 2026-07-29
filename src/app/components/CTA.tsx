"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useSupabaseSession } from '@/lib/auth';

const CTA = () => {
  const { user: sessionUser, status } = useSupabaseSession();

  const handleClick = () => {
    window.location.href = status === "authenticated" ? "/chat" : "/register";
  };

  return (
    <section className="relative py-20 md:py-24 overflow-hidden" style={{ background: "#f8fafc" }}>
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl p-10 sm:p-14 md:p-20 text-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f0fdf4 100%)",
            border: "1px solid rgba(16,185,129,0.15)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.08), inset 0 0 80px rgba(16,185,129,0.03)",
          }}
        >
          {/* BG glow blobs */}
          <div
            className="absolute top-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-[-60px] left-[-60px] w-[250px] h-[250px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%)" }}
          />

          {/* Top line accent */}
          <div
            className="absolute top-0 inset-x-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)" }}
          />

          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.25)",
                color: "#10b981",
              }}
            >
              <Sparkles size={11} />
              Unisciti alla community
            </div>

            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-5 text-[#0f172a]"
            >
              Pronto a scrivere codice
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                con confidenza?
              </span>
            </h2>

            <p
              className="text-lg sm:text-xl mb-10 md:mb-12 max-w-2xl mx-auto"
              style={{ color: "#475569" }}
            >
              Unisciti a oltre 10.000 sviluppatori che costruiscono più velocemente
              e meglio con Semplycode.
            </p>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleClick}
              className="inline-flex items-center gap-2.5 px-10 py-4 rounded-full text-base font-bold transition-all group"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                boxShadow: "0 0 50px rgba(16,185,129,0.4), 0 8px 30px rgba(0,0,0,0.1)",
              }}
            >
              Inizia Gratis
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <p className="mt-5 text-xs" style={{ color: "#64748b" }}>
              Nessuna carta di credito richiesta · Cancella quando vuoi
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
