"use client";

import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Cambia tema"
      className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-black/[0.04] transition-colors text-[#475569] hover:text-[#0f172a]"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
