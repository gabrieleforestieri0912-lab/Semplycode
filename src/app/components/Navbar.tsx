/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef, MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Rocket,
  User,
  LogOut,
  Settings,
  BarChart3,
  Code2,
  Bookmark,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSupabaseSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./ThemeToggle";

const MotionLink = motion(Link);

const Navbar = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user: sessionUser, status } = useSupabaseSession();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1200) {
        setIsMobileMenuOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClickOutside = (event: MouseEvent | Event) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const t = {
    features: "Funzionalità",
    howItWorks: "Come funziona",
    pricing: "Prezzi",
    login: "Accedi",
    getStarted: "Inizia Ora",
    playground: "Chat AI",
    dashboard: "Dashboard",
    settings: "Impostazioni",
    profile: "Profilo",
    logout: "Esci",
    editor: "Editor",
  };

  const navLinks = [
    { href: "#demo", label: "Demo" },
    { href: "#funzionalita", label: "Funzionalità" },
    { href: "#estensione", label: "Estensione" },
    { href: "#prezzi", label: "Prezzi" },
  ];

  const navLinkClass = `relative font-medium transition-all duration-200 text-[#475569] hover:text-[#0f172a] text-sm`;

  const primaryBtnClass =
    "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white border border-emerald-400/30 shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/30 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200";
  const secondaryBtnClass =
    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-[#e2e8f0] text-[#475569] hover:text-[#0f172a] hover:border-[#cbd5e1] hover:bg-black/[0.02] active:scale-[0.97] transition-all duration-200";
  const mobileNavLinkClass =
    "flex items-center gap-3 px-5 py-4 rounded-xl text-base font-semibold text-[#475569] hover:bg-black/[0.03] hover:text-[#0f172a] active:scale-[0.99] transition-all duration-150";

return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      className={`fixed left-1/2 -translate-x-1/2 z-100 transition-all duration-500 ${
        scrolled
          ? 'top-6 w-[calc(100%-3rem)] max-w-5xl rounded-full bg-white/95 backdrop-blur-xl shadow-xl shadow-black/10 border border-emerald-500/20'
          : 'top-4 w-[calc(100%-2rem)] max-w-7xl rounded-full bg-white/60 backdrop-blur-sm border border-emerald-500/10 shadow-sm'
      }`}
    >
      <div className={`w-full px-4 sm:px-5 md:px-6 h-16 flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-12' : ''}`}>
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className={`relative transition-all duration-300 ${scrolled ? 'scale-90' : ''}`}>
              <div className={`absolute inset-0 bg-emerald-500/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${scrolled ? 'hidden' : ''}`} />
              <img
                src="/semplycode.png"
                alt="Semplycode"
                className={`rounded-lg relative z-1 transition-all duration-300 ${scrolled ? 'w-7 h-7' : 'w-9 h-9'}`}
              />
            </div>
            <span className="font-bold tracking-tight text-[#0f172a] transition-all duration-300 text-lg sm:text-xl">
              semplycode
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden xl:flex items-center gap-2 xl:gap-3">
          {navLinks.map((link) => {
            return (
              <Link
                key={link.href}
                href={link.href}
                className={navLinkClass + " px-3 py-1.5"}
              >
                <span className="relative z-10">{link.label}</span>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-linear-to-r from-transparent via-emerald-400 to-transparent group-hover:w-full transition-all duration-300" />
              </Link>
            );
          })}
        </div>

        {/* Right side: Playground + Dashboard buttons (lg+) + Account + Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Playground + Dashboard buttons - solo se autenticato */}
          {sessionUser && (
          <div className="flex items-center gap-2">
            <Link
              href="/chat"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500/60 hover:text-emerald-700 transition-all active:scale-[0.985]"
            >
              <Code2 size={16} />
              Chat AI
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500/60 hover:text-emerald-700 transition-all active:scale-[0.985]"
            >
              <BarChart3 size={16} />
              Dashboard
            </Link>
            <Link
              href="/notes"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500/60 hover:text-emerald-700 transition-all active:scale-[0.985]"
            >
              <Bookmark size={16} />
              Note
            </Link>
          </div>
          )}

          {/* Theme toggle — a sinistra dei bottoni di accesso */}
          <ThemeToggle />

          {/* Account / Auth */}
          {sessionUser ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/[0.04] transition-colors border border-[#e2e8f0] hover:border-emerald-500/40"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center ring-2 ring-emerald-500 transition-all duration-200">
                  {sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture ? (
                    <img
                      src={sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture}
                      alt="Avatar"
                      className="w-8 h-8 object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-90"
                      onClick={() => setIsProfileOpen(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ type: "spring", damping: 26, stiffness: 380, mass: 0.9 }}
                      className="absolute right-0 mt-3 w-56 bg-white backdrop-blur-xl border border-[#e2e8f0] rounded-2xl shadow-2xl shadow-black/10 z-95 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-[#e2e8f0]">
                        <p className="text-sm font-semibold text-[#0f172a]">
                          {sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || "Utente"}
                        </p>
                        <p className="text-xs text-[#64748b] truncate mt-0.5">
                          {sessionUser.email}
                        </p>
                      </div>
                      <div className="py-1.5">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            router.push("/dashboard");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#475569] hover:bg-black/[0.03] hover:text-[#0f172a] transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 text-[#64748b]" />
                          Dashboard
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            router.push("/chat");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#475569] hover:bg-black/[0.03] hover:text-[#0f172a] transition-colors"
                        >
                          <Code2 className="w-4 h-4 text-[#64748b]" />
                          {t.editor}
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            router.push("/notes");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#475569] hover:bg-black/[0.03] hover:text-[#0f172a] transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-[#64748b]" />
                          Il mio Cassetto
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            router.push("/settings");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#475569] hover:bg-black/[0.03] hover:text-[#0f172a] transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#64748b]" />
                          {t.settings}
                        </button>
                        <div className="my-1.5 border-t border-[#e2e8f0]/60" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600/80 hover:bg-red-500/[0.07] hover:text-red-600 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t.logout}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:flex px-5 py-2.5 rounded-full text-sm font-semibold text-[#475569] hover:text-[#0f172a] border border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-black/[0.02] transition-all active:scale-95"
              >
                {t.login}
              </Link>

              <Link
                href="/register"
                className="flex items-center gap-1.5 bg-linear-to-r from-emerald-500 to-teal-500 text-white px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.03] active:scale-95 transition-all duration-200"
              >
                <Rocket size={16} />
                <span className="hidden sm:inline">{t.getStarted}</span>
                <span className="sm:hidden">Inizia</span>
              </Link>
            </>
          )}

          {/* Hamburger under 1200px */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-black/[0.04] transition-colors text-[#475569] hover:text-[#0f172a]"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Full-height mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="xl:hidden fixed inset-0 top-0 bg-black/20 backdrop-blur-sm z-80"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="xl:hidden absolute top-full left-0 right-0 bg-white backdrop-blur-2xl border-b border-[#e2e8f0] z-85 overflow-hidden"
            >
              <div className="flex flex-col p-4 gap-1">
                {navLinks.map((link, i) => (
                  <MotionLink
                    key={link.href}
                    href={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <span className="w-1 h-4 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500/80 transition-colors" />
                    {link.label}
                  </MotionLink>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
