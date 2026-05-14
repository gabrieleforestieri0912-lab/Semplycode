'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
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
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full space-y-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <img src="/semplycode.png" alt="Semplycode" className="w-10 h-10 rounded-xl shadow-lg shadow-primary/20" />
          <span className="text-2xl font-bold tracking-tight text-primary">semplycode</span>
        </Link>
        
        <h2 className="text-3xl font-extrabold text-gray-900">Password Dimenticata?</h2>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Inserisci la tua email e ti invieremo le istruzioni per reimpostare la password.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 items-center text-red-700 text-sm text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-center text-emerald-700 text-sm text-left">
            <CheckCircle className="w-5 h-5 shrink-0" />
            {success}
          </div>
        )}

        <form className="mt-8 space-y-6 text-left" onSubmit={handleSubmit}>
          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">
              Indirizzo Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base bg-white"
                placeholder="nome@esempio.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex items-center justify-center py-4 px-4 border border-transparent text-base font-bold rounded-2xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                Invia Link di Reset
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Ricordi la password?{' '}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Accedi
          </Link>
        </div>
      </div>
    </div>
  );
}
