'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (searchParams.get('registered')) {
      setSuccess('Registrazione avvenuta con successo! Effettua il login.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/';
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        throw new Error('Email o password non validi');
      }

      router.push(result?.url || callbackUrl);
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
        <h2 className="text-3xl font-extrabold text-gray-900">Bentornato</h2>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Non hai un account?{' '}
          <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Creane uno gratis
          </Link>
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
          <div className="space-y-4">
            <div className="relative">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Indirizzo Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  required
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900"
                  placeholder="nome@azienda.com"
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              Password dimenticata?
            </Link>
          </div>

          <button
            disabled={isLoading}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-primary hover:bg-primary/90 focus:outline-none transition-all shadow-xl shadow-primary/25 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <span className="flex items-center gap-2">
                Accedi <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-500">oppure continua con</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.42 21.02 7.42 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.42 1 3.42 2.98 1.18 5.38l2.85 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Continua con Google
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
