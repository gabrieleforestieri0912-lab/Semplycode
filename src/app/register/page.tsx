'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CodeFloatBackground from "@/app/components/CodeFloatBackground";

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (!password) return { label: '', color: '', width: '0%' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const map = [
    { label: 'Debole', color: 'bg-red-500', width: '20%' },
    { label: 'Media', color: 'bg-orange-500', width: '40%' },
    { label: 'Buona', color: 'bg-yellow-500', width: '60%' },
    { label: 'Forte', color: 'bg-emerald-500', width: '80%' },
    { label: 'Molto forte', color: 'bg-emerald-400', width: '100%' },
  ];
  return map[Math.min(score, 4)];
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registrazione fallita');
        }

        if (data.needsEmailConfirmation) {
          setNeedsVerification(true);
          return;
        }

        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (!signInError) {
          router.push('/');
        } else {
          router.push('/login?registered=true');
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
  };

  return (
    <div className="min-h-dvh bg-white flex items-center justify-center px-4 py-12 font-sans text-[#0f172a] relative overflow-x-hidden">
      <CodeFloatBackground variant="sides" />
      <Link href="/" className="fixed top-5 left-5 z-50 flex items-center gap-1.5 text-sm text-[#64748b] hover:text-emerald-400 transition-colors">
        <ArrowRight className="w-4 h-4 rotate-180" />
        Home
      </Link>
      <div className="relative z-10 w-full max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-extrabold text-[#0f172a]">Inizia oggi</h2>
        <p className="text-sm text-[#475569]">
          Hai già un account?{' '}
          <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
            Accedi qui
          </Link>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-center text-red-600 text-sm text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {needsVerification && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-emerald-700 mb-1">Registrazione completata!</h3>
                <p className="text-sm text-emerald-600 leading-relaxed">
                  Ti abbiamo inviato un&apos;email di conferma a <strong className="text-emerald-700">{formData.email}</strong>.
                  Clicca il link nell&apos;email per attivare il tuo account.
                </p>
                <p className="text-xs text-emerald-500 mt-2">
                  Non hai ricevuto nulla? Controlla la cartella spam.
                </p>
              </div>
            </div>
          </div>
        )}

        {!needsVerification && (
        <form className="mt-2 space-y-4 text-left" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider ml-1">Nome</label>
              <input
                name="firstName"
                type="text"
                required
                onChange={handleChange}
                className="w-full bg-white border border-[#e2e8f0] rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-[#0f172a] placeholder:text-[#64748b]"
                placeholder="Mario"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider ml-1">Cognome</label>
              <input
                name="lastName"
                type="text"
                required
                onChange={handleChange}
                className="w-full bg-white border border-[#e2e8f0] rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-[#0f172a] placeholder:text-[#64748b]"
                placeholder="Rossi"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider ml-1 block">Email di Lavoro</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] w-5 h-5" />
              <input
                name="email"
                type="email"
                required
                onChange={handleChange}
                className="w-full bg-white border border-[#e2e8f0] rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-[#0f172a] placeholder:text-[#64748b]"
                placeholder="mario@azienda.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider ml-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] w-5 h-5" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                onChange={handleChange}
                className="w-full bg-white border border-[#e2e8f0] rounded-2xl py-3 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-[#0f172a] placeholder:text-[#64748b]"
                placeholder="Min. 8 caratteri"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getPasswordStrength(formData.password).color}`}
                    style={{ width: getPasswordStrength(formData.password).width }}
                  />
                </div>
                <p className={`text-xs mt-1 font-medium ${getPasswordStrength(formData.password).color.replace('bg-', 'text-')}`}>
                  {getPasswordStrength(formData.password).label}
                </p>
              </div>
            )}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3 items-start mt-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 leading-relaxed">
              Creando un account, accetti i nostri <strong>Termini di Servizio</strong> e <strong>Privacy Policy</strong>.
            </p>
          </div>

          <button
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 focus:outline-none transition-all shadow-xl shadow-emerald-500/25 disabled:opacity-70 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <span className="flex items-center gap-2">
                Crea Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e2e8f0]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-[#64748b]">oppure continua con</span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/api/auth/callback` } });
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[#e2e8f0] rounded-2xl text-sm font-semibold text-[#475569] bg-white hover:bg-[#f8fafc] focus:outline-none transition-all cursor-pointer"
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
              await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/api/auth/callback` } });
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[#e2e8f0] rounded-2xl text-sm font-semibold text-[#475569] bg-white hover:bg-[#f8fafc] focus:outline-none transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Continua con GitHub
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
