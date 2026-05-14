"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";

const Hero = () => {
  const { data: session, status } = useSession();

  const handleMainButtonClick = () => {
    if (session || status === "authenticated") {
      window.location.href = "/chat";
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <section className="relative pt-12 md:pt-20 pb-20 md:pb-32 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl xs:text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6 md:mb-8 leading-[1.1]"
          >
            Smetti di combattere con il codice. <br className="hidden sm:block" />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-primary italic"
            >
              Inizia a capirlo.
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base xs:text-lg md:text-xl text-gray-600 mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0"
          >
            Semplycode ti aiuta a scomporre la logica complessa, trovare i bug
            istantaneamente e imparare a scrivere miglior codice con
            spiegazioni intelligenti in tempo reale.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-row items-center gap-4 max-w-xl mx-auto"
          >
            <button 
              onClick={handleMainButtonClick}
              className="w-full"
            >
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="block w-full bg-primary text-white px-6 py-3.5 rounded-full text-base font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 cursor-pointer"
              >
                Prova Semplycode Gratis
              </motion.span>
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 px-6 py-3.5 rounded-full text-base font-bold hover:bg-gray-50 transition-all text-gray-700 cursor-pointer"
            >
              <svg
                className="w-5 h-5 text-primary"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Guarda Demo
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Decorative background element */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] xs:w-[600px] md:w-[1000px] h-[300px] xs:h-[600px] md:h-[1000px] bg-primary/10 rounded-full -z-10 blur-[80px] md:blur-[120px]"
      ></motion.div>
    </section>
  );
};

export default Hero;
