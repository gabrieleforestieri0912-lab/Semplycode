"use client";

import React, { useState, useEffect, Suspense, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SkeletonAuthForm } from "@/app/components/Skeleton";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (searchParams.get("registered")) {
      setSuccess("Registrazione avvenuta con successo! Effettua il login.");
    }
  }, [searchParams]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw new Error("Email o password non validi");
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/";
      router.push(callbackUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 py-8 font-sans relative">
      <Link
        href="/"
        className="fixed top-5 left-5 z-50 flex items-center gap-1.5 text-sm text-[#64748b] hover:text-emerald-400 transition-colors"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Home
      </Link>
      <div className="max-w-md w-full space-y-4 text-center">
        <h2 className="text-2xl font-extrabold text-[#0f172a]">Bentornato</h2>
        <p className="text-sm text-[#475569] text-center">
          Non hai un account?{" "}
          <Link
            href="/register"
            className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Creane uno gratis
          </Link>
        </p>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-2 text-sm text-left"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-red-100 text-red-500 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-red-700">Accesso non riuscito</div>
                <div className="text-red-600 mt-1">{error}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
              >
                Recupera password
              </Link>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  (
                    document.querySelector('input[name="password"]') as HTMLInputElement
                  )?.focus();
                }}
                className="text-sm px-3 py-1 rounded-full bg-red-100 border border-red-200 text-red-500 hover:bg-red-200 transition-colors"
              >
                Riprova
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3 items-center text-emerald-600 text-sm text-left">
            <CheckCircle className="w-5 h-5 shrink-0" />
            {success}
          </div>
        )}

        <form className="mt-2 space-y-4 text-left" onSubmit={handleSubmit}>
          {isLoading ? (
            <div className="space-y-3 animate-pulse" aria-hidden>
              <div className="flex items-center gap-3 justify-center">
                <div className="w-10 h-10 rounded-xl bg-[#e2e8f0]"></div>
                <div className="w-40 h-6 rounded bg-[#e2e8f0]"></div>
              </div>
              <div className="space-y-3">
                <div className="h-3 w-32 rounded bg-[#e2e8f0] mx-1"></div>
                <div className="h-12 rounded-2xl bg-[#e2e8f0]"></div>
                <div className="h-3 w-24 rounded bg-[#e2e8f0] mx-1"></div>
                <div className="h-12 rounded-2xl bg-[#e2e8f0]"></div>
              </div>
              <div className="h-12 rounded-2xl bg-[#e2e8f0]"></div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="relative">
                  <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1 block ml-1">
                    Indirizzo Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] w-5 h-5" />
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#e2e8f0] rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-[#0f172a] placeholder:text-[#64748b]"
                      placeholder="nome@azienda.com"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1 block ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] w-5 h-5" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#e2e8f0] rounded-2xl py-3 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-[#0f172a] placeholder:text-[#64748b]"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Password dimenticata?
                </Link>
              </div>

              <button
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 focus:outline-none transition-all shadow-xl shadow-emerald-500/25 disabled:opacity-70"
              >
                <span className="flex items-center gap-2">
                  Accedi
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e2e8f0]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-[#64748b]">
                oppure continua con
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${window.location.origin}/api/auth/callback` },
              });
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[#e2e8f0] rounded-2xl text-sm font-semibold text-[#475569] bg-white hover:bg-[#f8fafc] focus:outline-none transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.77-4.58l-7.98-6.19A23.99 23.99 0 000 24c0 5.13 1.62 9.87 4.38 13.69l6.15-5.1z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continua con Google
          </button>

          <button
            type="button"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signInWithOAuth({
                provider: "github",
                options: { redirectTo: `${window.location.origin}/api/auth/callback` },
              });
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[#e2e8f0] rounded-2xl text-sm font-semibold text-[#475569] bg-white hover:bg-[#f8fafc] focus:outline-none transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Continua con GitHub
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<SkeletonAuthForm />}>
      <LoginForm />
    </Suspense>
  );
}
