'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante l\'invio');
      }

      setSuccess(data.message);
      setEmail('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans relative">
      <Link href="/" className="fixed top-5 left-5 z-50 flex items-center gap-1.5 text-sm text-[#64748b] hover:text-emerald-400 transition-colors">
        <ArrowRight className="w-4 h-4 rotate-180" />
        Home
      </Link>
      <div className="max-w-md w-full space-y-4 text-center">

        <h2 className="text-2xl font-extrabold text-[#0f172a]">Password Dimenticata?</h2>
        <p className="text-sm text-[#475569] text-center">
          Inserisci la tua email e ti invieremo le istruzioni per reimpostare la password.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex gap-3 items-center text-red-600 text-sm text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex gap-3 items-center text-emerald-600 text-sm text-left">
            <CheckCircle className="w-5 h-5 shrink-0" />
            {success}
          </div>
        )}

        <form className="mt-2 space-y-4 text-left" onSubmit={handleSubmit}>
          <div className="relative">
            <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1 block ml-1">
              Indirizzo Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] w-5 h-5" />
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#e2e8f0] rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-[#0f172a] placeholder:text-[#64748b]"
                placeholder="nome@esempio.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                Invia Link di Reset
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-[#475569]">
          Ricordi la password?{' '}
          <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
            Accedi
          </Link>
        </div>
      </div>
    </div>
  );
}
