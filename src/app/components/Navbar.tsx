/* eslint-disable @next/next/no-location-assign-relative-destination */
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
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useSupabaseSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";


const MotionLink = motion.create(Link);

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
    window.location.href = "/login";
  };

  const { language } = useLanguage();
  // Definizione dizionari — EN ha tutte le chiavi di IT (parità garantita)
  const itDict = {
    features: "Funzionalità",
    howItWorks: "Come Funziona",
    pricing: "Prezzi",
    faq: "FAQ",
    login: "Accedi",
    getStarted: "Inizia Ora",
    playground: "Chat AI",
    dashboard: "Dashboard",
    settings: "Impostazioni",
    profile: "Profilo",
    logout: "Esci",
    editor: "Editor",
  } as const;
  const enDict: Record<keyof typeof itDict, string> = {
    features: "Features",
    howItWorks: "How it Works",
    pricing: "Pricing",
    faq: "FAQ",
    login: "Log in",
    getStarted: "Get Started",
    playground: "Chat AI",
    dashboard: "Dashboard",
    settings: "Settings",
    profile: "Profile",
    logout: "Log out",
    editor: "Editor",
  };
  const translations: Record<string, typeof itDict> = {
    it: itDict,
    en: enDict as unknown as typeof itDict,
  };
  const t = translations[language] || itDict;

  const navLinks = [
    { href: "/#come-funziona", label: t.howItWorks },
    { href: "/#funzionalita", label: t.features },
    { href: "/#prezzi", label: t.pricing },
    { href: "/#faq", label: t.faq },
  ];

  const profileMenuVariants: Variants = {
    hidden: { opacity: 0, y: 8, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 26,
        stiffness: 380,
        mass: 0.9,
        staggerChildren: 0.04,
        delayChildren: 0.02,
      },
    },
    exit: { opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } },
  };

  const profileItemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  // Menu minimalista: solo essenziali (il resto è già in navbar)
  const profileItems = [
    { icon: Bookmark, label: "Il mio Cassetto", href: "/notes" },
    { icon: Settings, label: t.settings, href: "/settings" },
  ];

  // Hover navbar — solo underline emerald, niente pill
  const navLinkClass = `group relative inline-flex items-center px-2 py-1.5 text-sm font-medium text-[#475569] hover:text-emerald-600 transition-colors`;

  const primaryBtnClass =
    "inline-flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:brightness-105 hover:scale-[1.02] active:scale-[0.97] transition-all border border-emerald-500/10";
  const secondaryBtnClass =
    "hidden sm:inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold border border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:text-emerald-600 shadow-sm hover:shadow-md active:scale-[0.97] transition-all";
  const chatBtnClass =
    "inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-bold border border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/20 active:scale-[0.97] transition-all";
  const mobileNavLinkClass =
    "flex items-center gap-3 px-5 py-4 rounded-xl text-base font-semibold text-[#475569] hover:bg-black/[0.03] hover:text-[#0f172a] active:scale-[0.99] transition-all duration-150";

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      className={`fixed left-1/2 -translate-x-1/2 z-100 transition-all duration-500 ${scrolled
          ? 'top-2 sm:top-6 w-[calc(100%-1rem)] sm:w-[calc(100%-3rem)] max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl rounded-full bg-white/95 backdrop-blur-xl shadow-xl shadow-black/10 border border-emerald-500/20'
          : 'top-2 sm:top-4 w-[calc(100%-0.75rem)] sm:w-[calc(100%-2rem)] max-w-7xl 2xl:max-w-screen-2xl 3xl:max-w-[1720px] 4xl:max-w-[1920px] rounded-full bg-white/75 backdrop-blur-md border border-emerald-500/10 shadow-sm'
        }`}
    >
      <div className={`w-full px-3 sm:px-5 md:px-6 h-14 sm:h-16 flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-11 sm:h-12' : ''}`}>
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <div className={`relative transition-all duration-300 ${scrolled ? 'scale-90' : ''}`}>
              <div className={`absolute inset-0 bg-emerald-500/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${scrolled ? 'hidden' : ''}`} />
              <img
                src="/semplycode.png"
                alt="Semplycode"
                className={`rounded-lg relative z-1 transition-all duration-300 ${scrolled ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-8 h-8 sm:w-9 sm:h-9'}`}
              />
            </div>
            <span className="font-bold tracking-tight text-[#0f172a] transition-all duration-300 text-base sm:text-xl">
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

        {/* Right side: Account / Auth + Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-3">

          {sessionUser && (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:text-emerald-600 shadow-sm transition-all"
              >
                <BarChart3 size={14} />
                {t.dashboard}
              </Link>
              <Link
                href="/chat"
                className={chatBtnClass}
              >
                Chat AI
              </Link>
            </>
          )}

          {sessionUser && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
                className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all border ${isProfileOpen ? 'bg-white border-emerald-500/50 shadow-md shadow-emerald-500/10' : 'bg-white border-[#e2e8f0] hover:border-emerald-500/40 hover:shadow-md'}`}
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center ring-2 transition-all duration-200 ${isProfileOpen ? 'ring-emerald-500' : 'ring-emerald-500/70 group-hover:ring-emerald-500'}`}>
                  {sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture ? (
                    <img
                      src={sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture}
                      alt="Avatar"
                      className="w-full h-full object-cover"
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
                      variants={profileMenuVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 mt-3 w-72 bg-white backdrop-blur-xl border border-[#e2e8f0] rounded-2xl shadow-2xl shadow-black/15 z-95 overflow-hidden"
                    >
                      <div className="relative px-5 py-4 border-b border-[#e2e8f0] bg-gradient-to-br from-emerald-50 via-white to-teal-50">
                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0 ring-2 ring-white">
                            {sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture ? (
                              <img src={sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[#0f172a] truncate flex items-center gap-1.5">
                              {sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || "Utente"}
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
                            </p>
                            <p className="text-xs text-[#64748b] truncate">
                              {sessionUser.email}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full bg-emerald-500 text-white shadow-sm">
                            Pro
                          </span>
                        </div>
                      </div>
                      <div className="p-2">
                        {profileItems.map((item) => (
                          <motion.button
                            key={item.href}
                            variants={profileItemVariants}
                            onClick={() => {
                              setIsProfileOpen(false);
                              router.push(item.href);
                            }}
                            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#334155] hover:text-[#0f172a] hover:bg-[#f8fafc] hover:shadow-sm border border-transparent hover:border-[#e2e8f0] transition-all"
                          >
                            <span className="w-9 h-9 rounded-xl bg-[#f1f5f9] group-hover:bg-emerald-500 flex items-center justify-center border border-[#e2e8f0] group-hover:border-emerald-500 shadow-sm transition-all">
                              <item.icon className="w-4 h-4 text-[#64748b] group-hover:text-white transition-colors" />
                            </span>
                            <span className="flex-1 text-left">{item.label}</span>
                            <span className="w-6 h-6 rounded-full bg-white border border-[#e2e8f0] group-hover:border-emerald-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            </span>
                          </motion.button>
                        ))}
                        <div className="my-2 h-px bg-gradient-to-r from-transparent via-[#e2e8f0] to-transparent" />
                        <motion.button
                          variants={profileItemVariants}
                          onClick={handleLogout}
                          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#475569] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                        >
                          <span className="w-9 h-9 rounded-xl bg-red-50 group-hover:bg-red-500 flex items-center justify-center border border-red-100 group-hover:border-red-500 shadow-sm transition-all">
                            <LogOut className="w-4 h-4 text-red-500 group-hover:text-white transition-colors" />
                          </span>
                          <span className="flex-1 text-left">{t.logout}</span>
                        </motion.button>
                      </div>
                      <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between">
                        <span className="text-[11px] text-[#94a3b8]">Semplycode AI</span>
                        <span className="text-[11px] font-medium text-emerald-600">10 analisi/giorno</span>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Account / Auth — gerarchia: Accedi = link secondario, Inizia Ora = unica CTA primaria */}
          {!sessionUser && (
            <>
              <Link
                href="/login"
                className={secondaryBtnClass}
              >
                {t.login}
              </Link>

              <Link
                href="/register"
                className={primaryBtnClass}
              >
                <Rocket size={15} />
                <span className="hidden sm:inline">{t.getStarted}</span>
                <span className="sm:hidden">Inizia</span>
              </Link>
            </>
          )}

          {/* Hamburger under 1200px */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl hover:bg-black/[0.04] transition-colors text-[#475569] hover:text-[#0f172a]"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Floating full-width mobile menu drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="xl:hidden fixed inset-0 top-0 bg-black/30 backdrop-blur-sm z-80"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer panel floating below pill navbar */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="xl:hidden absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl border border-[#e2e8f0] rounded-3xl shadow-2xl z-85 overflow-hidden max-h-[calc(100vh-6rem)] overflow-y-auto"
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
                    <span className="w-1.5 h-4 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500/80 transition-colors" />
                    {link.label}
                  </MotionLink>
                ))}

                <div className="my-2 border-t border-[#e2e8f0]/80" />

                {sessionUser ? (
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={mobileNavLinkClass}
                    >
                      <BarChart3 className="w-4 h-4 text-emerald-500" />
                      Dashboard
                    </Link>
                    <Link
                      href="/chat"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={mobileNavLinkClass}
                    >
                      <Code2 className="w-4 h-4 text-emerald-500" />
                      Chat AI
                    </Link>
                    <Link
                      href="/notes"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={mobileNavLinkClass}
                    >
                      <Bookmark className="w-4 h-4 text-emerald-500" />
                      Il mio Cassetto
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={mobileNavLinkClass}
                    >
                      <Settings className="w-4 h-4 text-emerald-500" />
                      Impostazioni
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-5 py-3 rounded-xl text-base font-semibold text-red-600 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Esci
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 pt-1">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold border border-[#e2e8f0] text-[#0f172a] hover:bg-black/[0.03] transition-colors"
                    >
                      {t.login}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                    >
                      <Rocket size={16} />
                      {t.getStarted}
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
