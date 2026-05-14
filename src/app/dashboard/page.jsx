'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { BarChart3, MessageSquare, Code2, CreditCard, Zap, Loader2, Sparkles, TrendingUp, Clock, Users, Crown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ analyses: 0, chats: 0, remainingAnalyses: 10, plan: 'free' });

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      setUser({
        firstName: session.user.firstName || session.user.name?.split(' ')[0] || 'User',
        lastName: session.user.lastName || session.user.name?.split(' ').slice(1).join(' ') || '',
        email: session.user.email || '',
      });
    } else {
      router.push('/login');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!session?.user) return;

    const loadStats = async () => {
      const response = await fetch('/api/user/stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    };

    loadStats();
  }, [session]);

  const planLabel = stats.plan === 'enterprise' ? 'Enterprise' : stats.plan === 'pro' ? 'Pro' : 'Gratuito';
  const remainingLabel = stats.remainingAnalyses === null ? '∞' : stats.remainingAnalyses;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <Loader2 className="w-8 h-8 animate-spin text-primary relative z-10" />
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-16 bg-white rounded-3xl border border-gray-200 shadow-2xl my-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 via-emerald-400/10 to-amber-500/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-violet-500/5 to-primary/5 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/3"></div>
      
      <div className="relative z-10 space-y-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-emerald-500 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                  <BarChart3 className="text-white w-8 h-8" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Dashboard</h1>
                <p className="text-gray-500 font-medium">Benvenuto, <span className="text-primary font-semibold">{user.firstName}</span>!</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 font-medium">Tutto funziona</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-emerald-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-primary via-primary to-emerald-500 rounded-3xl p-10 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4" />
                      <span className="font-medium text-sm opacity-90">Analisi Rimanenti</span>
                    </div>
                    <p className="text-6xl font-black tracking-tight">{remainingLabel}</p>
                    <p className="text-xs text-white/70 mt-1">{stats.dailyLimit ? 'al giorno' : 'illimitate'}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-35 transition-opacity duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 shadow-lg shadow-gray-100/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Code2 className="w-4 h-4 text-violet-600" />
                      <span className="font-medium text-gray-600 text-sm">Analisi Totali</span>
                    </div>
                    <p className="text-6xl font-black text-gray-900 tracking-tight">{stats.analyses}</p>
                    <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Questa settimana
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center">
                    <Code2 className="w-7 h-7 text-violet-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-3xl blur-xl opacity-15 group-hover:opacity-25 transition-opacity duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 shadow-lg shadow-gray-100/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-gray-600 text-sm">Chat Totali</span>
                    </div>
                    <p className="text-6xl font-black text-gray-900 tracking-tight">{stats.chats}</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" /> Collaboratori
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              Azioni Rapide
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Link href="/chat">
                <div className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-8 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                        <Code2 className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Playground</h3>
                        <p className="text-sm text-gray-500">Analizza il tuo codice</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Link>

              <Link href="/settings">
                <div className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-8 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                        <Sparkles className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Impostazioni</h3>
                        <p className="text-sm text-gray-500">Gestisci il tuo account</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Link>

              <Link href="/pricing">
                <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 backdrop-blur-xl border border-amber-200/50 rounded-2xl p-8 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-500 group-hover:scale-110 transition-all duration-300">
                        <CreditCard className="w-7 h-7 text-amber-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">Aggiorna Piano</h3>
                        <p className="text-sm text-gray-500">Passa a Pro</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Link>

              <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur-xl border border-emerald-200/50 rounded-2xl p-8">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Zap className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Piano Attuale</h3>
                      <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1">
                        <Crown className="w-4 h-4" /> {planLabel}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 py-2.5 bg-emerald-100 rounded-full">
                    <span className="text-sm font-semibold text-emerald-700">Attivo</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-base text-gray-500">Ultimo accesso: oggi</span>
            </div>
            <span className="text-sm text-gray-400">SimplyCode Dashboard</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}