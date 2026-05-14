/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

const Navbar = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      setUser({
        id: session.user.id,
        firstName:
          session.user.firstName || session.user.name?.split(" ")[0] || "User",
        lastName:
          session.user.lastName ||
          session.user.name?.split(" ").slice(1).join(" ") ||
          "",
        email: session.user.email || "",
      });
    } else {
      setUser(null);
    }
  }, [session, status]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    setUser(null);
    setIsProfileOpen(false);
    await nextAuthSignOut({ callbackUrl: "/" });
  };

  const t = {
    features: "Funzionalità",
    howItWorks: "Come funziona",
    pricing: "Prezzi",
    login: "Accedi",
    getStarted: "Inizia Ora",
    playground: "Playground",
    dashboard: "Dashboard",
    settings: "Impostazioni",
    profile: "Profilo",
    logout: "Esci",
  };

  const navLinks = [
    { href: "#features", label: t.features },
    { href: "#how-it-works", label: t.howItWorks },
    { href: "#pricing", label: t.pricing },
    { href: "/chat", label: t.playground, isSpecial: true },
    { href: "/dashboard", label: t.dashboard, isSpecial: true },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/semplycode.png"
              alt="Semplycode"
              className="w-8 h-8 rounded-lg"
            />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-primary">
              semplycode
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                link.isSpecial
                  ? "text-primary hover:opacity-80 border-l border-gray-200 pl-6 lg:pl-8 ml-2"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-10"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden py-1"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push("/dashboard");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push("/chat");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Code2 className="w-4 h-4" />
                        Editor
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push("/settings");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Impostazioni
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t.logout}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex px-5 py-2.5 rounded-full text-sm font-bold text-gray-600 hover:text-primary hover:bg-gray-50 transition-all border border-gray-200"
            >
              {t.login}
            </Link>
          )}

          {!user && (
            <Link
              href="/register"
              className="hidden xs:flex bg-primary text-white px-4 sm:px-5 py-2.5 rounded-full text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 items-center gap-2 active:scale-95"
            >
              <Rocket size={16} />
              <span className="hidden sm:inline">{t.getStarted}</span>
              <span className="sm:hidden">Inizia</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-50 overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                    link.isSpecial
                      ? "text-primary bg-primary/5"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <div className="h-px bg-gray-100 my-2" />
              {user ? (
                <div className="flex flex-col gap-2 px-4 py-2">
                  <div className="py-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link
                    href="/chat"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-base font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Editor
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-4 py-2.5 rounded-xl text-base font-semibold text-red-600 hover:bg-red-50 text-left"
                  >
                    {t.logout}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-600 font-medium"
                  >
                    {t.login}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-primary text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-primary/20"
                  >
                    {t.getStarted}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
