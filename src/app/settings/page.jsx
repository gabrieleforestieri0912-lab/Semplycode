'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { User, Mail, CreditCard, LogOut, Loader2, Save, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      setUser({
        firstName: session.user.firstName || session.user.name?.split(' ')[0] || 'User',
        lastName: session.user.lastName || session.user.name?.split(' ').slice(1).join(' ') || '',
        email: session.user.email || '',
        plan: session.user.plan || 'free',
      });
    } else {
      router.push('/login');
    }
  }, [session, status, router]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleSave = async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Salvataggio non riuscito');
      }

      setUser((current) => ({ ...current, ...data.user }));
      setFeedback({ type: 'success', message: 'Modifiche salvate con successo.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const planLabel = user?.plan === 'enterprise' ? 'Piano Enterprise' : user?.plan === 'pro' ? 'Piano Pro' : 'Piano Gratuito';

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="w-full max-w-3xl mx-auto p-4 md:p-6 bg-[#0a0c10] rounded-3xl border border-emerald-900/30 shadow-2xl my-12 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link href="/dashboard" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Impostazioni</h1>
            <p className="text-sm text-gray-400">Gestisci il tuo account</p>
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0d1117]/80 border border-emerald-900/30 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profilo
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Nome</label>
                <input
                  type="text"
                  value={user.firstName}
                  onChange={(event) => setUser((current) => ({ ...current, firstName: event.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#0a0c10] border border-emerald-900/30 rounded-xl text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Cognome</label>
                <input
                  type="text"
                  value={user.lastName}
                  onChange={(event) => setUser((current) => ({ ...current, lastName: event.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#0a0c10] border border-emerald-900/30 rounded-xl text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0d1117]/80 border border-emerald-900/30 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Email
            </h2>
            <div>
              <input
                type="email"
                value={user.email}
                onChange={() => {}}
                disabled
                className="w-full px-4 py-2.5 bg-[#0a0c10] border border-emerald-900/30 rounded-xl text-gray-400"
              />
              <p className="text-xs text-gray-500 mt-2">L&apos;email non può essere modificata</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0d1117]/80 border border-emerald-900/30 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Abbonamento
            </h2>
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
              <p className="text-emerald-400 font-medium">{planLabel}</p>
              <p className="text-sm text-gray-400">{user.plan === 'free' ? '10 analisi AI al giorno' : 'Analisi AI illimitate'}</p>
            </div>
          </motion.div>

          {feedback && (
            <div className={`rounded-xl px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-900/20 text-red-400 border border-red-500/30'}`}>
              {feedback.message}
            </div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {loading ? 'Salvataggio...' : 'Salva Modifiche'}
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleLogout}
            className="w-full py-3 border border-red-900/50 text-red-400 rounded-xl font-medium hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Esci
          </motion.button>
        </div>
      </div>
    </section>
  );
}