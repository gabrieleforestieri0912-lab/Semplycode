/* eslint-disable react-hooks/purity */
'use client';

import { useRouter } from 'next/navigation';
import { useSupabaseSession } from '@/lib/auth';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { BarChart3, MessageSquare, Code2, CreditCard, Zap, Loader2, Sparkles, TrendingUp, Clock, Users, Crown, ChevronRight, Calendar, Lightbulb, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { formatTokens } from '@/lib/tokenBudget';
import { SkeletonCard, SkeletonList, SkeletonChart, SkeletonPage } from '@/app/components/Skeleton';

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface Stats {
  tokensUsed: number;
  chats: number;
  remainingTokens: number | null;
  tokenLimit: number | null;
  plan: string;
}

interface ChatItem {
  _id: string;
  title?: string;
  language?: string;
  createdAt?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const router = useRouter();
  const { user: supabaseUser, status } = useSupabaseSession();
  const user: UserInfo | null = supabaseUser
    ? {
        firstName: supabaseUser.user_metadata?.full_name?.split(' ')[0] || 'User',
        lastName: supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        email: supabaseUser.email || '',
      }
    : null;

  const { data: stats, isLoading: statsLoading } = useSWR<Stats>(
    status === 'authenticated' ? '/api/user/stats' : null,
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  const { data: historyData, isLoading: chatsLoading } = useSWR(
    status === 'authenticated' ? '/api/chat/history' : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const recentChats: ChatItem[] = historyData?.chats?.slice(0, 5) || [];

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const resolvedStats = stats || { tokensUsed: 0, chats: 0, remainingTokens: 100000, tokenLimit: 100000, plan: 'free' };
  const planLabel = resolvedStats.plan === 'enterprise' ? 'Enterprise' : resolvedStats.plan === 'pro' ? 'Pro' : resolvedStats.plan === 'starter' ? 'Starter' : 'Gratuito';
  const remainingLabel = resolvedStats.remainingTokens === null ? '∞' : formatTokens(resolvedStats.remainingTokens ?? 0);

  if (status === 'loading' || !user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-white">
          <SkeletonPage />
        </main>
        <Footer />
      </>
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
    <>
      <Navbar />

      <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-12 bg-white rounded-3xl border border-[#e2e8f0] shadow-xl shadow-black/5 my-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-linear-to-br from-primary/10 via-emerald-500/5 to-transparent rounded-full blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-linear-to-tr from-emerald-500/5 to-transparent rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/3"></div>

      <div className="relative z-10 space-y-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-emerald-500 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-primary to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <BarChart3 className="text-white w-7 h-7" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0f172a]">Dashboard</h1>
                <p className="text-sm text-[#64748b] mt-1">Benvenuto, <span className="text-primary font-semibold">{user.firstName}</span>!</p>
              </div>
            </div>

          </motion.div>

          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-br from-primary to-emerald-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white border border-[#e2e8f0] rounded-2xl p-6 text-[#0f172a] overflow-hidden shadow-sm">
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium text-sm text-emerald-600">Token Rimanenti</span>
                    </div>
                    <p className="text-5xl font-black tracking-tighter leading-none">{remainingLabel}</p>
                    <p className="text-xs text-[#64748b] mt-1">
                      {resolvedStats.tokenLimit == null ? 'illimitati' : `${formatTokens(resolvedStats.tokenLimit)} al mese`}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-br from-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Code2 className="w-4 h-4 text-violet-500" />
                      <span className="font-medium text-sm text-[#64748b]">Token Usati</span>
                    </div>
                    <p className="text-5xl font-black text-[#0f172a] tracking-tighter leading-none">{formatTokens(resolvedStats.tokensUsed)}</p>
                    <p className="text-xs text-violet-500 mt-1.5 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Questo mese
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center">
                    <Code2 className="w-6 h-6 text-violet-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-br from-amber-500 to-orange-500 rounded-2xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                      <span className="font-medium text-sm text-[#64748b]">Chat Totali</span>
                    </div>
                    <p className="text-5xl font-black text-[#0f172a] tracking-tighter leading-none">{resolvedStats.chats}</p>
                    <p className="text-xs text-[#64748b] mt-1.5 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" /> Collaboratori
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-bold text-[#0f172a] mb-4 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              Azioni Rapide
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <Link href="/chat">
                <div className="group relative bg-white border border-[#e2e8f0] rounded-2xl p-5 hover:border-emerald-300 transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-sm">
                   <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary transition-all">
                     <Code2 className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#0f172a]">Chat AI</h3>
                    <p className="text-sm text-[#64748b]">Analizza il tuo codice</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#64748b] group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              <Link href="/settings">
                <div className="group relative bg-white border border-[#e2e8f0] rounded-2xl p-5 hover:border-emerald-300 transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-sm">
                   <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary transition-all">
                     <Sparkles className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#0f172a]">Impostazioni</h3>
                    <p className="text-sm text-[#64748b]">Gestisci il tuo account</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#64748b] group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              <Link href="/pricing">
                <div className="group relative bg-white border border-[#e2e8f0] rounded-2xl p-6 hover:border-amber-300 transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-500 transition-all">
                     <CreditCard className="w-5 h-5 text-amber-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#0f172a]">Aggiorna Piano</h3>
                    <p className="text-sm text-[#64748b]">Passa a Pro</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#64748b] group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              <div className="relative bg-white border border-[#e2e8f0] rounded-2xl p-6 flex items-center gap-4 shadow-sm">
                 <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#0f172a]">Piano Attuale</h3>
                  <p className="text-sm text-[#64748b] font-medium">{planLabel}</p>
                </div>
                <div className="px-3 py-1 text-xs bg-emerald-50 text-emerald-600 rounded-full font-medium">Attivo</div>
              </div>
            </div>
           </motion.div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
           <h2 className="text-xl font-bold text-[#0f172a] flex items-center gap-3">
             <Clock className="w-5 h-5 text-primary" />
             Attività Recente
           </h2>
           <Link href="/chat" className="text-sm text-primary hover:underline flex items-center gap-1">
             Vedi tutto <ChevronRight className="w-4 h-4" />
           </Link>
         </div>

          {recentChats.length > 0 ? (
            <div className="space-y-3">
              {recentChats.map((chat: ChatItem, index: number) => (
                <div
                  key={chat._id || index}
                  onClick={() => router.push(`/chat?load=${chat._id}`)}
                  className="group flex items-center justify-between bg-white border border-[#e2e8f0] hover:border-emerald-300 rounded-2xl px-5 py-3.5 cursor-pointer transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4">
                     <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                       <Code2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-[#0f172a] group-hover:text-primary transition-colors">
                          {chat.title || 'Nuova analisi'}
                        </p>
                        <p className="text-xs text-[#64748b]">
                          {chat.language || 'javascript'} • {new Date(chat.createdAt || Date.now()).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                  <ChevronRight className="w-5 h-5 text-[#64748b] group-hover:text-primary transition-all group-hover:translate-x-0.5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 text-center text-[#64748b] shadow-sm">
              <p className="text-sm">Nessuna attività recente.</p>
              <p className="text-xs mt-1">Inizia una nuova analisi in Chat AI.</p>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold text-[#0f172a] mb-4 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            Utilizzo questa settimana
          </h2>
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-end justify-between gap-3 h-40">
              {[
                { day: 'Lun', value: 8, max: 10 },
                { day: 'Mar', value: 6, max: 10 },
                { day: 'Mer', value: 10, max: 10 },
                { day: 'Gio', value: 4, max: 10 },
                { day: 'Ven', value: 9, max: 10 },
                { day: 'Sab', value: 3, max: 10 },
                { day: 'Dom', value: 7, max: 10 },
              ].map((day, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className="w-full bg-[#f1f5f9] rounded-t-lg relative" style={{ height: `${(day.value / day.max) * 100}%` }}>
                    <div
                      className="absolute bottom-0 w-full bg-linear-to-t from-primary to-emerald-400 rounded-t-lg transition-all"
                      style={{ height: '100%' }}
                    />
                  </div>
                  <div className="text-[10px] text-[#64748b] mt-2">{day.day}</div>
                  <div className="text-xs font-medium text-[#0f172a]">{day.value}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#64748b] text-center mt-4">Attività della settimana</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold text-[#0f172a] mb-4 flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-500" />
            Il tuo piano
          </h2>
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-[#0f172a]">{planLabel}</div>
                  <div className="px-3 py-1 text-xs bg-emerald-50 text-emerald-600 rounded-full font-medium">ATTIVO</div>
                </div>
                <p className="text-sm text-[#64748b] mt-1">
                  {resolvedStats.tokenLimit == null
                    ? 'Token illimitati'
                    : `${formatTokens(resolvedStats.tokenLimit)} token al mese`}
                </p>
              </div>

              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#64748b]">Utilizzo del mese</span>
                  <span className="font-medium text-[#0f172a]">
                    {resolvedStats.tokenLimit != null
                      ? `${formatTokens(resolvedStats.tokensUsed)} / ${formatTokens(resolvedStats.tokenLimit)}`
                      : 'Illimitato'}
                  </span>
                </div>
                <div className="h-3 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-primary to-emerald-400 rounded-full transition-all"
                    style={{
                      width: resolvedStats.tokenLimit != null
                        ? `${Math.min(100, (resolvedStats.tokensUsed / resolvedStats.tokenLimit) * 100)}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>

              <Link href="/pricing" className="text-sm text-primary hover:underline flex items-center gap-1 whitespace-nowrap">
                Gestisci piano <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold text-[#0f172a] mb-4 flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Consigli & Prossimi passi
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 group cursor-pointer transition-all shadow-sm" onClick={() => router.push('/chat')}>
              <Target className="w-6 h-6 text-primary mb-3" />
              <h4 className="font-semibold text-[#0f172a] mb-1 group-hover:text-primary transition-colors">Carica i tuoi file</h4>
              <p className="text-sm text-[#64748b]">Carica file di codice e l&apos;AI li analizza automaticamente.</p>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 group cursor-pointer transition-all shadow-sm" onClick={() => router.push('/chat')}>
              <Target className="w-6 h-6 text-primary mb-3" />
              <h4 className="font-semibold text-[#0f172a] mb-1 group-hover:text-primary transition-colors">Analizza un progetto intero</h4>
              <p className="text-sm text-[#64748b]">Incolla più file o un intero modulo per feedback architetturale.</p>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 group cursor-pointer transition-all shadow-sm" onClick={() => router.push('/pricing')}>
              <Target className="w-6 h-6 text-amber-500 mb-3" />
              <h4 className="font-semibold text-[#0f172a] mb-1 group-hover:text-amber-500 transition-colors">Passa a Pro</h4>
              <p className="text-sm text-[#64748b]">Sblocca più token al mese e modelli più potenti.</p>
            </div>
          </div>
        </motion.div>

       <div className="flex justify-end text-sm border-t border-[#e2e8f0] pt-6 text-[#64748b]">
          <span className="text-primary">Semplycode</span>
       </div>
      </div>
    </section>

      <Footer />
    </>
  );
}
