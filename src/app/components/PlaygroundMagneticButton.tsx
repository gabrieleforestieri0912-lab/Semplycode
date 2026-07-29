"use client";

import React, { useRef, useState, MouseEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

interface Position {
  x: number;
  y: number;
}

export default function PlaygroundMagneticButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxDistance = 25;

    let x = (e.clientX - centerX) * 0.35;
    let y = (e.clientY - centerY) * 0.35;

    const distance = Math.sqrt(x * x + y * y);
    if (distance > maxDistance) {
      const scale = maxDistance / distance;
      x *= scale;
      y *= scale;
    }

    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  return (
    <Link href="/chat" className="group">
      <div
        ref={buttonRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        className="relative inline-block"
      >
        <motion.div
          animate={{
            x: position.x,
            y: position.y,
          }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 15,
            mass: 0.8,
          }}
          className="relative flex items-center justify-center gap-3 px-10 py-4.5 rounded-2xl font-semibold text-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-emerald-500/40 group-hover:scale-[1.02] border border-white/10 overflow-hidden"
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              transform: isHovering 
                ? `translate(${position.x * 1.2}px, ${position.y * 1.2}px)` 
                : 'none',
              transition: 'transform 0.1s ease-out',
            }}
          />

          <Play className="w-5 h-5" />
          <span>Prova Chat AI</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </motion.div>
      </div>
    </Link>
  );
}
