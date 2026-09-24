/* eslint-disable react-hooks/purity */
'use client';

import { useRouter } from 'next/navigation';
import { useSupabaseSession } from '@/lib/auth';
import useSWR from 'swr';
import { motion, type Variants } from 'framer-motion';
import {
  BarChart3, MessageSquare, Code2, CreditCard, Zap, Sparkles, TrendingUp,
  Clock, Crown, ChevronRight, Calendar, Lightbulb, Target, ArrowRight,
  BookOpen, Activity, Flame, Award, FileCode, Globe
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { formatTokens } from '@/lib/tokenBudget';
import { SkeletonPage } from '@/app/components/Skeleton';

interface UserInfo { firstName: string; lastName: string; email: string; }

interface Stats {
  tokensUsed: number;
  chats: number;
  remainingTokens: number | null;
  tokenLimit: number | null;
  plan: string;
  periodStart?: string;
}

interface ChatItem {
  id?: string;
  _id?: string;
  title?: string;
  language?: string;
  createdAt?: string;
  created_at?: string;
  messages?: { role: string; content: string }[];
}

interface NoteItem {
  id: string;
  language?: string;
  status?: string;
  created_at?: string;
  leitner_box?: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── helpers ─────────────────────────────────────────────────────────────────

function getDayName(dateStr: string, short = true) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT', { weekday: short ? 'short' : 'long' });
}

function isoToDate(s: string | undefined) {
  return s ? new Date(s) : null;
}

function buildWeeklyActivity(chats: ChatItem[]) {
  const days: Record<string, number> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days[key] = 0;
  }
  for (const c of chats) {
    const raw = c.created_at || c.createdAt || '';
    if (!raw) continue;
    const key = new Date(raw).toISOString().slice(0, 10);
    if (key in days) days[key]++;
  }
  return Object.entries(days).map(([date, count]) => ({ date, count, label: getDayName(date) }));
}

function buildLanguageStats(chats: ChatItem[]) {
  const counts: Record<string, number> = {};
  for (const c of chats) {
    const lang = (c.language || 'altro').toLowerCase();
    counts[lang] = (counts[lang] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;
  const colors = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
  return sorted.map(([lang, count], i) => ({
    lang,
    count,
    pct: Math.round((count / total) * 100),
    color: colors[i % colors.length],
  }));
}

function calcStreak(chats: ChatItem[]): number {
  if (!chats.length) return 0;
  const days = new Set(
    chats.map((c) => new Date(c.created_at || c.createdAt || Date.now()).toISOString().slice(0, 10))
  );
  let streak = 0;
  const cur = new Date();
  while (true) {
    const key = cur.toISOString().slice(0, 10);
    if (days.has(key)) { streak++; cur.setDate(cur.getDate() - 1); }
    else break;
  }
  return streak;
}

function calcTokenTrend(periodStart: string | undefined, tokensUsed: number, tokenLimit: number | null) {
  if (!tokenLimit) return null;
  const start = isoToDate(periodStart) || new Date();
  const daysElapsed = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000));
  const daysInMonth = 30;
  const projected = Math.round((tokensUsed / daysElapsed) * daysInMonth);
  const pct = Math.round((projected / tokenLimit) * 100);
  return { projected, pct: Math.min(pct, 200) };
}

// ─── component ───────────────────────────────────────────────────────────────

const container: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item: Variants = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } } };

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

  const { data: stats } = useSWR<Stats>(
    status === 'authenticated' ? '/api/user/stats' : null, fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  const { data: historyData } = useSWR(
    status === 'authenticated' ? '/api/chat/history' : null, fetcher,
    { refreshInterval: 30000 }
  );

  const { data: notesData } = useSWR(
    status === 'authenticated' ? '/api/notes' : null, fetcher,
    { refreshInterval: 60000 }
  );

  if (status === 'unauthenticated') { router.push('/login'); return null; }
  if (status === 'loading' || !user) return (<><Navbar /><main className="min-h-screen bg-white"><SkeletonPage /></main><Footer /></>);

  const allChats: ChatItem[] = historyData?.chats || [];
  const allNotes: NoteItem[] = notesData?.notes || [];
  const recentChats = allChats.slice(0, 6);
  const resolvedStats = stats || { tokensUsed: 0, chats: allChats.length, remainingTokens: 100000, tokenLimit: 100000, plan: 'free' };
  const planLabel = { enterprise: 'Enterprise', pro: 'Pro', starter: 'Starter' }[resolvedStats.plan] || 'Gratuito';
  const remainingLabel = resolvedStats.remainingTokens === null ? '∞' : formatTokens(resolvedStats.remainingTokens ?? 0);
  const weeklyActivity = buildWeeklyActivity(allChats);
  const maxActivity = Math.max(...weeklyActivity.map((d) => d.count), 1);
  const langStats = buildLanguageStats(allChats);
  const streak = calcStreak(allChats);
  const tokenTrend = calcTokenTrend(resolvedStats.periodStart, resolvedStats.tokensUsed, resolvedStats.tokenLimit);
  const readyNotes = allNotes.filter((n) => n.status === 'ready').length;
  const usagePct = resolvedStats.tokenLimit ? Math.min(100, (resolvedStats.tokensUsed / resolvedStats.tokenLimit) * 100) : 0;

  return (
    <>
      <Navbar />

      <section className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 md:py-12 mt-20 sm:mt-24 mb-10">

        {/* ── Hero header ── */}
        <motion.div variants={container} initial="hidden" animate="visible" className="space-y-8">
          <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-40 animate-pulse" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <BarChart3 className="text-white w-7 h-7" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">Dashboard</h1>
                <p className="text-sm text-[#64748b] mt-0.5">Benvenuto, <span className="text-emerald-600 font-semibold">{user.firstName}</span> 👋</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {streak > 0 && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-bold text-orange-600">{streak} giorni di fila</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                <Crown className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">{planLabel}</span>
              </div>
            </div>
          </motion.div>

          {/* ── KPI cards ── */}
          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Token rimanenti */}
            <div className="relative group col-span-2 md:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-35 transition-opacity" />
              <div className="relative bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm h-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Zap className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Token rimasti</span>
                </div>
                <p className="text-4xl font-black text-[#0f172a] tracking-tighter">{remainingLabel}</p>
                <div className="mt-3 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all" style={{ width: `${100 - usagePct}%` }} />
                </div>
                <p className="text-xs text-[#64748b] mt-1.5">{resolvedStats.tokenLimit == null ? 'illimitati' : `su ${formatTokens(resolvedStats.tokenLimit)}/mese`}</p>
              </div>
            </div>

            {/* Token usati */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl blur-xl opacity-15 group-hover:opacity-25 transition-opacity" />
              <div className="relative bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm h-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-violet-500" />
                  </div>
                  <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Usati</span>
                </div>
                <p className="text-4xl font-black text-[#0f172a] tracking-tighter">{formatTokens(resolvedStats.tokensUsed)}</p>
                {tokenTrend && (
                  <p className="text-xs text-[#64748b] mt-2">
                    Proiezione: <span className={`font-semibold ${tokenTrend.pct > 100 ? 'text-red-500' : 'text-violet-500'}`}>{formatTokens(tokenTrend.projected)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Chat totali */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl blur-xl opacity-15 group-hover:opacity-25 transition-opacity" />
              <div className="relative bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm h-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Chat AI</span>
                </div>
                <p className="text-4xl font-black text-[#0f172a] tracking-tighter">{allChats.length}</p>
                <p className="text-xs text-[#64748b] mt-2">sessioni totali</p>
              </div>
            </div>

            {/* Note salvate */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl blur-xl opacity-15 group-hover:opacity-25 transition-opacity" />
              <div className="relative bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm h-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Note</span>
                </div>
                <p className="text-4xl font-black text-[#0f172a] tracking-tighter">{allNotes.length}</p>
                <p className="text-xs text-[#64748b] mt-2">{readyNotes} categorizzate</p>
              </div>
            </div>
          </motion.div>

          {/* ── Charts row ── */}
          <motion.div variants={item} className="grid md:grid-cols-3 gap-6">
            {/* Weekly bar chart */}
            <div className="md:col-span-2 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bold text-[#0f172a] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" /> Attività ultimi 7 giorni
                  </h2>
                  <p className="text-xs text-[#64748b] mt-0.5">Numero di chat AI per giorno</p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-medium">{allChats.length} totali</span>
              </div>
              <div className="flex items-end gap-3 h-36">
                {weeklyActivity.map((day, i) => {
                  const heightPct = maxActivity > 0 ? (day.count / maxActivity) * 100 : 0;
                  const isToday = i === 6;
                  return (
                    <div key={day.date} className="flex flex-col items-center flex-1 gap-1">
                      <span className="text-[10px] font-medium text-[#64748b]">{day.count > 0 ? day.count : ''}</span>
                      <div className="w-full rounded-t-lg relative flex-1 flex items-end">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-gradient-to-t from-emerald-400 to-emerald-200'}`}
                          style={{ height: `${Math.max(heightPct, day.count > 0 ? 8 : 4)}%`, minHeight: '4px' }}
                        />
                      </div>
                      <span className={`text-[10px] font-medium ${isToday ? 'text-emerald-600' : 'text-[#94a3b8]'}`}>{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Language breakdown */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-[#0f172a] flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-violet-500" /> Linguaggi
              </h2>
              {langStats.length > 0 ? (
                <div className="space-y-3">
                  {langStats.map((l) => (
                    <div key={l.lang}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-[#0f172a] capitalize">{l.lang}</span>
                        <span className="text-[#64748b]">{l.count} ({l.pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${l.pct}%`, backgroundColor: l.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#64748b] mt-4">Inizia una chat per vedere i tuoi linguaggi preferiti.</p>
              )}
            </div>
          </motion.div>

          {/* ── Usage progress ── */}
          <motion.div variants={item}>
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-bold text-[#0f172a] flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" /> Piano {planLabel}
                    <span className="ml-1 px-2 py-0.5 text-xs bg-emerald-50 text-emerald-600 rounded-full font-medium">ATTIVO</span>
                  </h2>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    {resolvedStats.tokenLimit == null ? 'Token illimitati' : `${formatTokens(resolvedStats.tokensUsed)} / ${formatTokens(resolvedStats.tokenLimit)} token usati questo mese`}
                  </p>
                </div>
                <Link href="/#prezzi" className="text-sm text-emerald-600 hover:underline flex items-center gap-1 whitespace-nowrap font-medium">
                  Gestisci piano <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {resolvedStats.tokenLimit != null && (
                <>
                  <div className="flex items-center justify-between text-xs text-[#64748b] mb-1.5">
                    <span>Utilizzo mensile</span>
                    <span className={`font-semibold ${usagePct > 80 ? 'text-red-500' : usagePct > 60 ? 'text-amber-500' : 'text-emerald-600'}`}>{Math.round(usagePct)}%</span>
                  </div>
                  <div className="h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${usagePct > 80 ? 'bg-gradient-to-r from-red-400 to-red-500' : usagePct > 60 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                  {usagePct > 80 && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      ⚠️ Stai per esaurire i token mensili. <Link href="/#prezzi" className="underline">Fai l&apos;upgrade</Link>
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* ── Quick actions ── */}
          <motion.div variants={item}>
            <h2 className="text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" /> Azioni rapide
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { href: '/chat', icon: Code2, label: 'Chat AI', sub: 'Analizza codice', color: 'emerald' },
                { href: '/notes', icon: BookOpen, label: 'Il Cassetto', sub: `${allNotes.length} note`, color: 'amber' },
                { href: '/settings', icon: Sparkles, label: 'Impostazioni', sub: 'Account & tema', color: 'violet' },
                { href: '/#prezzi', icon: CreditCard, label: 'Upgrade', sub: 'Più token', color: 'blue' },
              ].map(({ href, icon: Icon, label, sub, color }) => (
                <Link key={href} href={href}>
                  <div className={`group bg-white border border-[#e2e8f0] rounded-2xl p-4 hover:border-${color}-300 hover:shadow-md transition-all cursor-pointer h-full`}>
                    <div className={`w-10 h-10 bg-${color}-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-${color}-100 transition-colors`}>
                      <Icon className={`w-5 h-5 text-${color}-500`} />
                    </div>
                    <h3 className="font-semibold text-[#0f172a] text-sm">{label}</h3>
                    <p className="text-xs text-[#64748b] mt-0.5">{sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* ── Recent chats ── */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" /> Sessioni recenti
              </h2>
              <Link href="/chat" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
                Apri editor <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {recentChats.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {recentChats.map((chat, index) => {
                  const chatId = chat.id || chat._id;
                  const date = chat.created_at || chat.createdAt;
                  return (
                    <div
                      key={chatId || index}
                      onClick={() => router.push(`/chat${chatId ? `?load=${chatId}` : ''}`)}
                      className="group flex items-center justify-between bg-white border border-[#e2e8f0] hover:border-emerald-300 hover:shadow-sm rounded-2xl px-5 py-3.5 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                          <FileCode className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#0f172a] group-hover:text-emerald-600 transition-colors text-sm truncate">
                            {chat.title || 'Nuova analisi'}
                          </p>
                          <p className="text-xs text-[#64748b]">
                            {chat.language || 'code'} · {date ? new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '–'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#cbd5e1] group-hover:text-emerald-500 shrink-0 transition-colors" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 text-center">
                <MessageSquare className="w-10 h-10 text-[#cbd5e1] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#64748b]">Nessuna sessione ancora</p>
                <p className="text-xs text-[#94a3b8] mt-1">Inizia una chat AI per vedere qui la cronologia</p>
                <Link href="/chat" className="inline-flex items-center gap-1 mt-4 text-sm text-emerald-600 font-medium hover:underline">
                  Inizia ora <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </motion.div>

          {/* ── Tips ── */}
          <motion.div variants={item}>
            <h2 className="text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" /> Prossimi passi
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: Target, color: 'emerald', title: 'Analizza un progetto', body: 'Incolla più file o un ZIP e chiedi un feedback architetturale completo.', href: '/chat' },
                { icon: Award, color: 'amber', title: 'Rivedi le note', body: `Hai ${allNotes.filter((n) => n.leitner_box === 1 || !n.leitner_box).length} note da ripassare nel Cassetto.`, href: '/notes' },
                { icon: Flame, color: 'orange', title: 'Mantieni lo streak', body: streak > 0 ? `Sei a ${streak} giorni consecutivi! Continua così.` : 'Inizia oggi la tua prima sessione per accendere lo streak.', href: '/chat' },
              ].map(({ icon: Icon, color, title, body, href }) => (
                <Link key={title} href={href}>
                  <div className={`group bg-white border border-[#e2e8f0] rounded-2xl p-5 hover:border-${color}-200 hover:shadow-sm cursor-pointer transition-all h-full`}>
                    <div className={`w-9 h-9 bg-${color}-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-${color}-100 transition-colors`}>
                      <Icon className={`w-4 h-4 text-${color}-500`} />
                    </div>
                    <h4 className={`font-semibold text-[#0f172a] text-sm mb-1 group-hover:text-${color}-600 transition-colors`}>{title}</h4>
                    <p className="text-xs text-[#64748b] leading-relaxed">{body}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* ── Footer note ── */}
          <motion.div variants={item} className="flex justify-end pt-2 border-t border-[#f1f5f9]">
            <p className="text-xs text-[#94a3b8]">
              <span className="font-semibold text-emerald-600">Semplycode</span> · aggiornato in tempo reale
            </p>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </>
  );
}
