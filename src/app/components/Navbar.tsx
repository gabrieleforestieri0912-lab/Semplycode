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
    if (!window.confirm("Sei sicuro di voler uscire?")) return;
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
    { href: "/#demo", label: "Demo" },
    { href: "/#funzionalita", label: "Funzionalità" },
    { href: "/#estensione", label: "Estensione" },
    { href: "/#prezzi", label: "Prezzi" },
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

  const profileItems = [
    { icon: BarChart3, label: "Dashboard", href: "/dashboard" },
    { icon: Code2, label: t.editor, href: "/chat" },
    { icon: Bookmark, label: "Il mio Cassetto", href: "/notes" },
    { icon: Settings, label: "Profilo & Impostazioni", href: "/settings" },
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
            <Link
              href="/chat"
              className="hidden sm:flex items-center px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500/60 hover:text-emerald-700 transition-all active:scale-[0.985]"
            >
              Chat AI
            </Link>
          )}

          {sessionUser && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-black/[0.04] transition-colors border border-[#e2e8f0] hover:border-emerald-500/40"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center ring-2 ring-emerald-500 transition-all duration-200">
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
                      className="absolute right-0 mt-3 w-60 bg-white backdrop-blur-xl border border-[#e2e8f0] rounded-2xl shadow-2xl shadow-black/10 z-95 overflow-hidden"
                    >
                      <div className="relative px-4 py-3.5 border-b border-[#e2e8f0] bg-linear-to-br from-primary/[0.06] to-emerald-500/[0.06]">
                        <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="relative flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#0f172a] truncate">
                              {sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || "Utente"}
                            </p>
                            <p className="text-xs text-[#64748b] truncate mt-0.5">
                              {sessionUser.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-1.5">
                        {profileItems.map((item) => (
                          <motion.button
                            key={item.href}
                            variants={profileItemVariants}
                            onClick={() => {
                              setIsProfileOpen(false);
                              router.push(item.href);
                            }}
                            className="group w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#475569] hover:text-[#0f172a] hover:bg-black/[0.03] transition-colors"
                          >
                            <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all">
                              <item.icon className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
                            </span>
                            {item.label}
                          </motion.button>
                        ))}
                        <div className="my-1.5 border-t border-[#e2e8f0]/60" />
                        <motion.button
                          variants={profileItemVariants}
                          onClick={handleLogout}
                          className="group w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600/80 hover:text-red-600 hover:bg-red-500/[0.07] transition-colors"
                        >
                          <span className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-500 transition-all">
                            <LogOut className="w-4 h-4 text-red-500 group-hover:text-white transition-colors" />
                          </span>
                          {t.logout}
                        </motion.button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Account / Auth */}
          {!sessionUser && (
            <>
              <Link
                href="/login"
                className="hidden sm:flex px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#475569] hover:text-[#0f172a] border border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-black/[0.02] transition-all active:scale-95"
              >
                {t.login}
              </Link>

              <Link
                href="/register"
                className="flex items-center gap-1.5 bg-linear-to-r from-emerald-500 to-teal-500 text-white px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.03] active:scale-95 transition-all duration-200"
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
