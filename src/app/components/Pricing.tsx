/* eslint-disable @next/next/no-location-assign-relative-destination */
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Zap,
  Crown,
  Rocket,
  Building2,
  Loader2,
  Sparkles,
  ArrowRight,
  Lock,
  Info,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { loadStripe } from "@stripe/stripe-js";
import { useSupabaseSession } from "@/lib/auth";
import Toast, { useToast } from "./Toast";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

interface PlanStyle {
  accent: string;
  glow: string;
  btnClass: string;
}

interface PlanPrice {
  monthly: string;
  annual: string;
  annualBilled: string;
}

interface Plan {
  id: string;
  name: string;
  price: PlanPrice;
  tagline: string;
  priceId?: string;
  features: string[];
  icon: React.ReactElement;
  popular?: boolean;
  isWaitlist?: boolean;
  waitlistNote?: string;
}

interface SectionTranslation {
  titleA: string;
  titleB: string;
  subtitle: string;
  badge: string;
  monthlyToggle: string;
  annualToggle: string;
  annualDiscount: string;
  monthlySuffix: string;
  billedMonthlyNote: string;
  billedAnnuallyNote: string;
  freeNote: string;
  getStarted: string;
  popular: string;
  secure: string;
  waitlistCta: string;
  creditsFootnote: string;
  plans: Plan[];
}

const PLAN_STYLES: Record<string, PlanStyle> = {
  free: {
    accent: "#64748b",
    glow: "rgba(100,116,139,0.18)",
    btnClass:
      "bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.97]",
  },
  starter: {
    accent: "#3b82f6",
    glow: "rgba(59,130,246,0.28)",
    btnClass:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 active:scale-[0.97]",
  },
  pro: {
    accent: "#10b981",
    glow: "rgba(16,185,129,0.35)",
    btnClass:
      "bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white shadow-lg shadow-emerald-500/30 active:scale-[0.97]",
  },
  enterprise: {
    accent: "#8b5cf6",
    glow: "rgba(139,92,246,0.28)",
    btnClass:
      "bg-white border border-[#e2e8f0] text-[#0f172a] hover:bg-[#f8fafc] active:scale-[0.97]",
  },
};

const Pricing = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const { user: sessionUser } = useSupabaseSession();
  const { toast, showToast } = useToast();

  const t: Record<string, SectionTranslation> = {
    en: {
      titleA: "Simple,",
      titleB: "transparent pricing",
      subtitle: "Pick the plan that fits your coding journey. Credits are the clear unit — see what 1 credit means below.",
      badge: "Pricing Plans",
      monthlyToggle: "Monthly",
      annualToggle: "Annual",
      annualDiscount: "Save 20%",
      monthlySuffix: "/mo",
      billedMonthlyNote: "Billed monthly",
      billedAnnuallyNote: "/year billed annually",
      freeNote: "Free forever, no card needed · ~20 analyses / mo",
      getStarted: "Get Started",
      waitlistCta: "Join waitlist",
      popular: "Most Popular",
      secure: "Secure payments via Stripe · Cancel anytime",
      creditsFootnote: "1 credit = 1 token ≈ 4 characters (src/lib/tokenBudget.ts). ~20 analyses estimated on ~5k credits per analysis (code + response); actual count varies with length.",
      plans: [
        {
          id: "free",
          name: "Free",
          price: {
            monthly: "0",
            annual: "0",
            annualBilled: "0",
          },
          tagline: "Start building for free",
          features: [
            "100,000 credits / mo ≈ ~20 analyses*",
            "Standard model",
            "Web Editor + auto language detection",
            "Basic error detection with line + Italian explanation",
            "1 file per request (100 KB, max 12k chars)",
            "Community Support",
          ],
          icon: <Zap />,
        },
        {
          id: "starter",
          name: "Starter",
          price: {
            monthly: "4.99",
            annual: "3.99",
            annualBilled: "47.88",
          },
          tagline: "For growing developers",
          priceId: "price_1Rx1kF9ddZe187yvStarterPlan123",
          features: [
            "1,500,000 credits / mo ≈ ~300 analyses*",
            "In-depth reviews (Correction + Revision)",
            "Up to 3 files (100 KB each) + GitHub import",
            "Export Markdown/code + shareable link",
            "History: 50 chats + 100 Drawer notes",
            "Email Support",
          ],
          icon: <Rocket />,
        },
        {
          id: "pro",
          name: "Pro",
          price: {
            monthly: "7.99",
            annual: "6.39",
            annualBilled: "76.68",
          },
          tagline: "For serious developers",
          priceId: "price_1Rx1kF9ddZe187yvProPlan123",
          features: [
            "3,000,000 credits / mo ≈ ~600 analyses*",
            "All analysis types + Security/Performance/Style focus",
            "Up to 5 files + ZIP (100 KB each) + GitHub",
            "Advanced models enabled",
            "History: 200 chats + 500 notes, priority queue",
            "Priority Support",
          ],
          icon: <Crown />,
          popular: true,
        },
        {
          id: "enterprise",
          name: "Team",
          price: {
            monthly: "—",
            annual: "—",
            annualBilled: "—",
          },
          tagline: "Centralized billing — waitlist",
          features: [
            "Multi-seat with centralized billing (on request)",
            "Up to 20 files per request (100 KB each)",
            "Shared credit pool by agreed volume",
            "All analysis types + advanced models",
            "Shared priority support",
          ],
          icon: <Building2 />,
          isWaitlist: true,
          waitlistNote: "No price, no SSO/SAML, no white-label — waitlist only.",
        },
      ],
    },
    it: {
      titleA: "Prezzi semplici,",
      titleB: "senza sorprese",
      subtitle: "Scegli il piano adatto a te. I crediti sono l’unità chiara — sotto trovi cosa vale 1 credito.",
      badge: "Piani di Prezzo",
      monthlyToggle: "Mensile",
      annualToggle: "Annuale",
      annualDiscount: "Risparmia 20%",
      monthlySuffix: "/mese",
      billedMonthlyNote: "Fatturazione mensile",
      billedAnnuallyNote: "/anno fatturati annualmente",
      freeNote: "Sempre gratis, nessuna carta richiesta · ~20 analisi / mese",
      getStarted: "Inizia Ora",
      waitlistCta: "Iscriviti alla lista d’attesa",
      popular: "Più Popolare",
      secure: "Pagamenti sicuri con Stripe · Cancella in qualsiasi momento",
      creditsFootnote: "1 credito = 1 token ≈ 4 caratteri (src/lib/tokenBudget.ts:16). ~20 analisi stimate su ~5.000 crediti per analisi (codice + risposta); il numero reale varia con la lunghezza.",
      plans: [
        {
          id: "free",
          name: "Gratis",
          price: {
            monthly: "0",
            annual: "0",
            annualBilled: "0",
          },
          tagline: "Inizia a costruire gratis",
          features: [
            "100.000 crediti / mese ≈ ~20 analisi*",
            "Modello standard",
            "Editor web + rilevamento linguaggio automatico",
            "Rilevamento errori base con riga + spiegazione italiana",
            "1 file per richiesta (100 KB, max 12.000 caratteri)",
            "Supporto Community",
          ],
          icon: <Zap />,
        },
        {
          id: "starter",
          name: "Starter",
          price: {
            monthly: "4.99",
            annual: "3.99",
            annualBilled: "47.88",
          },
          tagline: "Per sviluppatori in crescita",
          priceId: "price_1Rx1kF9ddZe187yvStarterPlan123",
          features: [
            "1.500.000 crediti / mese ≈ ~300 analisi*",
            "Review approfondite (Correzione + Revisione)",
            "Fino a 3 file (100 KB cad.) + import GitHub",
            "Export Markdown/codice e link condivisibile",
            "Cronologia: 50 chat + 100 note nel Cassetto",
            "Supporto via Email",
          ],
          icon: <Rocket />,
        },
        {
          id: "pro",
          name: "Pro",
          price: {
            monthly: "7.99",
            annual: "6.39",
            annualBilled: "76.68",
          },
          tagline: "Per sviluppatori seri",
          priceId: "price_1Rx1kF9ddZe187yvProPlan123",
          features: [
            "3.000.000 crediti / mese ≈ ~600 analisi*",
            "Tutti i tipi di analisi + focus Sicurezza/Performance/Stile",
            "Fino a 5 file + ZIP (100 KB cad.) + GitHub",
            "Modelli avanzati sbloccati",
            "Cronologia: 200 chat + 500 note, coda prioritaria",
            "Supporto prioritario",
          ],
          icon: <Crown />,
          popular: true,
        },
        {
          id: "enterprise",
          name: "Team",
          price: {
            monthly: "—",
            annual: "—",
            annualBilled: "—",
          },
          tagline: "Fatturazione centralizzata — lista d’attesa",
          features: [
            "Posti multipli con fatturazione centralizzata (su richiesta)",
            "Fino a 20 file per richiesta (100 KB cad.)",
            "Pool crediti condiviso su volumi concordati",
            "Tutti i tipi di analisi + modelli avanzati",
            "Supporto prioritario condiviso",
          ],
          icon: <Building2 />,
          isWaitlist: true,
          waitlistNote: "Niente prezzo fisso, niente SSO/SAML, niente white-label — solo lista d’attesa.",
        },
      ],
    },
  };

  const current = t[language] || t.it;

  const handleCheckout = async (plan: Plan) => {
    if (plan.isWaitlist) {
      window.location.href = "/feedback?topic=team-waitlist";
      return;
    }
    if (plan.price.monthly === "0") {
      window.location.href = "/register";
      return;
    }
    if (!sessionUser?.email) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent("/#prezzi")}`;
      return;
    }
    try {
      setLoading(plan.id);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.priceId,
          planId: plan.id,
          interval: billingCycle === "annual" ? "year" : "month",
        }),
      });
      const { sessionId, url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) {
        window.location.href = url;
      } else if (sessionId) {
        const stripe = await stripePromise;

        const { error: stripeError } = await (stripe as any).redirectToCheckout({ sessionId });
        if (stripeError) throw new Error(stripeError.message);
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      showToast("Checkout fallito. Riprova.", "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section
      id="prezzi"
      className="relative py-24 md:py-32 overflow-hidden bg-[#f8fafc]"
    >
      {/* Background decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="container mx-auto relative z-10 max-w-7xl 2xl:max-w-screen-2xl 3xl:max-w-[1720px] 4xl:max-w-[1920px]">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 relative"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-15" />
            <span className="absolute inset-px rounded-full bg-white" />
            <Sparkles size={11} className="relative text-emerald-500" />
            <span className="relative text-emerald-600">{current.badge}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl 3xl:text-7xl font-black tracking-tight text-[#0f172a] mb-4 sm:mb-5"
          >
            {current.titleA}{" "}
            <span className="text-gradient">{current.titleB}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm xs:text-base sm:text-lg md:text-xl 3xl:text-2xl text-[#475569] max-w-2xl 3xl:max-w-3xl mx-auto px-2 sm:px-0"
          >
            {current.subtitle}
          </motion.p>

          {/* Billing Cycle Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center mt-8 px-2"
          >
            <div className="inline-flex items-center p-1 sm:p-1.5 bg-slate-200/75 border border-slate-300/80 rounded-full shadow-inner relative max-w-full">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`relative z-10 min-h-[40px] sm:min-h-[44px] flex items-center px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs md:text-sm font-semibold rounded-full transition-colors duration-200 ${billingCycle === "monthly"
                    ? "text-[#0f172a]"
                    : "text-[#64748b] hover:text-[#0f172a]"
                  }`}
              >
                {billingCycle === "monthly" && (
                  <motion.span
                    layoutId="billingPill"
                    className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                {current.monthlyToggle}
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`relative z-10 min-h-[40px] sm:min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs md:text-sm font-semibold rounded-full transition-colors duration-200 ${billingCycle === "annual"
                    ? "text-[#0f172a]"
                    : "text-[#64748b] hover:text-[#0f172a]"
                  }`}
              >
                {billingCycle === "annual" && (
                  <motion.span
                    layoutId="billingPill"
                    className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span>{current.annualToggle}</span>
                <span className="px-2 py-0.5 text-[10px] md:text-[11px] font-bold text-emerald-700 bg-emerald-100 rounded-full border border-emerald-200">
                  {current.annualDiscount}
                </span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 2xl:gap-8 3xl:gap-10 max-w-7xl 2xl:max-w-screen-2xl 3xl:max-w-[1720px] 4xl:max-w-[1920px] mx-auto items-stretch">
          {current.plans.map((plan, i) => {
            const style = PLAN_STYLES[plan.id];
            const isLoading = loading === plan.id;
            const isFree = plan.price.monthly === "0";
            const isWaitlist = !!plan.isWaitlist;
            const displayPrice =
              billingCycle === "annual" ? plan.price.annual : plan.price.monthly;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -8 }}
                className="relative group h-full"
              >
                {/* Popular floating badge */}
                {plan.popular && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold text-white shadow-lg shadow-emerald-500/40 bg-gradient-to-r from-emerald-500 to-teal-500"
                  >
                    <Sparkles size={11} />
                    {current.popular}
                  </motion.span>
                )}

                {/* Gradient border wrapper — hover su tutte le card */}
                <div
                  className={`relative h-full rounded-3xl p-px transition-all duration-500 ${plan.popular
                      ? "bg-gradient-to-b from-emerald-400 via-teal-300 to-emerald-500 shadow-xl shadow-emerald-500/20 group-hover:shadow-2xl group-hover:shadow-emerald-500/25"
                      : "bg-[#e2e8f0] group-hover:bg-gradient-to-br group-hover:from-emerald-300 group-hover:via-teal-300 group-hover:to-emerald-400 group-hover:shadow-xl group-hover:shadow-black/10"
                    }`}
                >
                  <div className="relative h-full rounded-[calc(1.5rem-1px)] bg-white overflow-hidden flex flex-col">
                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${style.glow.replace("0.2", "0.06").replace("0.28", "0.08").replace("0.35", "0.1").replace("0.18", "0.05")} 0%, transparent 70%)`,
                      }}
                    />

                    {/* Card body */}
                    <div className="relative flex flex-col h-full p-4 xs:p-5 sm:p-6 3xl:p-8 pt-6 sm:pt-7">
                      {/* Plan name + icon */}
                      <div className="flex items-center gap-3 mb-5">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                          style={{
                            background: `${style.accent}14`,
                            border: `1px solid ${style.accent}28`,
                            color: style.accent,
                            boxShadow: `0 8px 20px -8px ${style.glow}`,
                          }}
                        >
                          {React.cloneElement(
                            plan.icon as React.ReactElement<{ size?: number }>,
                            { size: 20 },
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-extrabold text-[#0f172a] leading-tight">
                            {plan.name}
                          </p>
                          <p className="text-xs mt-0.5 text-[#64748b]">
                            {plan.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="flex flex-col mb-5 min-h-[68px]">
                        {isWaitlist ? (
                          <>
                            <div className="flex items-end gap-2">
                              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#0f172a] leading-none">
                                Su richiesta
                              </span>
                            </div>
                            <div className="mt-1.5 text-xs text-[#64748b] min-h-[18px]">
                              <span>Lista d’attesa — nessun addebito ora</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-end gap-1">
                              <span className="text-xl font-medium text-[#64748b] leading-none mb-1.5">
                                €
                              </span>
                              <motion.span
                                key={`${plan.id}-${billingCycle}`}
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-3xl xs:text-4xl sm:text-5xl 3xl:text-6xl font-black tracking-tight text-[#0f172a] leading-none"
                              >
                                {displayPrice}
                              </motion.span>
                              {!isFree && (
                                <span className="mb-1 text-sm font-medium text-[#64748b]">
                                  {current.monthlySuffix}
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5 text-xs text-[#64748b] min-h-[18px]">
                              {isFree ? (
                                <span>{current.freeNote}</span>
                              ) : billingCycle === "annual" ? (
                                <span className="text-emerald-600 font-medium">
                                  €{plan.price.annualBilled} {current.billedAnnuallyNote}
                                </span>
                              ) : (
                                <span>{current.billedMonthlyNote}</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Separatore prezzo / offerte — richiesto */}
                      <div className="h-px bg-gradient-to-r from-transparent via-[#e2e8f0] to-transparent mb-6" />

                      {/* Features */}
                      <ul className="space-y-2.5 grow mb-6">
                        {plan.features.map((feature, j) => (
                          <li key={j} className="flex items-start gap-3">
                            <span
                              className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{
                                background: `${style.accent}1a`,
                                color: style.accent,
                              }}
                            >
                              <Check size={11} strokeWidth={3} />
                            </span>
                            <span className="text-xs xs:text-sm leading-snug text-[#475569]">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {isWaitlist && plan.waitlistNote && (
                        <p className="mb-4 text-xs leading-snug text-[#94a3b8] border-t border-[#f1f5f9] pt-3">
                          {plan.waitlistNote}
                        </p>
                      )}

                      {/* CTA */}
                      <button
                        onClick={() => handleCheckout(plan)}
                        disabled={loading !== null}
                        className={`w-full min-h-[48px] flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm 3xl:text-base font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${style.btnClass}`}
                      >
                        {isLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            {isWaitlist ? current.waitlistCta : current.getStarted}
                            <ArrowRight
                              size={14}
                              className="group-hover:translate-x-0.5 transition-transform"
                            />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Credits definition - visible */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto mt-10 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 sm:px-5 py-3.5 flex gap-3"
        >
          <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
          <p className="text-xs sm:text-sm leading-relaxed text-[#475569]">
            <span className="font-bold text-[#0f172a]">Cosa sono i crediti?</span> {current.creditsFootnote}
          </p>
        </motion.div>

        {/* Secure note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 flex items-center justify-center gap-2 text-sm text-[#64748b]"
        >
          <Lock size={13} />
          {current.secure}
        </motion.p>
      </div>
      <Toast toast={toast} />
    </section>
  );
};

export default Pricing;
