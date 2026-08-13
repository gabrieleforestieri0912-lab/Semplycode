"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Zap,
  Star,
  ShieldCheck,
  Loader2,
  Sparkles,
  ArrowRight,
  Lock,
  Coins,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { loadStripe } from "@stripe/stripe-js";
import { useSupabaseSession } from "@/lib/auth";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

interface PlanStyle {
  gradient: string;
  glow: string;
  accent: string;
  badge: boolean | null;
  iconBg: string;
  btnClass: string;
  featureCheck: string;
  headerBg: string;
  headerText: string;
  nameText: string;
  tokensBadge: string;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  tagline: string;
  priceId?: string;
  features: string[];
  tokensLabel: string;
  tokensNote: string;
  icon: React.ReactElement;
  popular?: boolean;
}

interface SectionTranslation {
  title: string;
  subtitle: string;
  monthly: string;
  getStarted: string;
  popular: string;
  free: string;
  secure: string;
  tokensTitle: string;
  tokensPerMonth: string;
  plans: Plan[];
}

const PLAN_STYLES: Record<string, PlanStyle> = {
  free: {
    gradient: "from-slate-100 to-slate-200",
    glow: "rgba(100,116,139,0.15)",
    accent: "#64748b",
    badge: null,
    iconBg: "bg-slate-100",
    btnClass:
      "bg-[#0f172a] hover:bg-[#1e293b] text-white",
    featureCheck: "text-emerald-600 bg-emerald-100",
    headerBg: "bg-slate-50",
    headerText: "text-slate-500",
    nameText: "text-slate-800",
    tokensBadge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  starter: {
    gradient: "from-blue-900 via-blue-800 to-indigo-900",
    glow: "rgba(59,130,246,0.35)",
    accent: "#3b82f6",
    badge: null,
    iconBg: "bg-blue-100",
    btnClass:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25",
    featureCheck: "text-blue-600 bg-blue-100",
    headerBg: "bg-blue-50",
    headerText: "text-blue-200",
    nameText: "text-white",
    tokensBadge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  pro: {
    gradient: "from-emerald-900 via-emerald-800 to-teal-900",
    glow: "rgba(16,185,129,0.45)",
    accent: "#059669",
    badge: true,
    iconBg: "bg-emerald-100",
    btnClass:
      "bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white shadow-lg shadow-emerald-500/25",
    featureCheck: "text-emerald-600 bg-emerald-100",
    headerBg: "bg-emerald-50",
    headerText: "text-emerald-200",
    nameText: "text-white",
    tokensBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  enterprise: {
    gradient: "from-violet-900 via-purple-900 to-indigo-900",
    glow: "rgba(139,92,246,0.35)",
    accent: "#8b5cf6",
    badge: null,
    iconBg: "bg-violet-100",
    btnClass:
      "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/25",
    featureCheck: "text-violet-600 bg-violet-100",
    headerBg: "bg-violet-50",
    headerText: "text-violet-200",
    nameText: "text-white",
    tokensBadge: "bg-violet-50 text-violet-700 border-violet-200",
  },
};

const Pricing = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);
  const { user: sessionUser } = useSupabaseSession();

  const t: Record<string, SectionTranslation> = {
    en: {
      title: "Simple, Transparent Pricing",
      subtitle: "Pick the plan that fits your coding journey.",
      monthly: "/mo",
      getStarted: "Get Started",
      popular: "Most Popular",
      free: "Always free",
      secure: "Secure payments via Stripe · Cancel anytime",
      tokensTitle: "AI tokens",
      tokensPerMonth: "tokens/month",
      plans: [
        {
          id: "free",
          name: "Free",
          price: "0",
          tagline: "Start building for free",
          tokensLabel: "100K",
          tokensNote: "tokens/month",
          features: [
            "100K AI tokens per month",
            "Standard Neural Engine",
            "Web Editor access",
            "Basic error detection",
            "Syntax highlighting",
            "Community Support",
          ],
          icon: <Zap />,
        },
        {
          id: "starter",
          name: "Starter",
          price: "9.99",
          tagline: "For growing developers",
          priceId: "price_1Rx1kF9ddZe187yvStarterPlan123",
          tokensLabel: "1.5M",
          tokensNote: "tokens/month",
          features: [
            "1.5M AI tokens per month",
            "Deep Code Reviews",
            "File upload (.py, .js, .ts…)",
            "Export reports (PDF)",
            "Priority queue",
            "Email Support",
          ],
          icon: <Sparkles />,
        },
        {
          id: "pro",
          name: "Pro",
          price: "19.99",
          tagline: "For serious developers",
          priceId: "price_1Rx1kF9ddZe187yvProPlan123",
          tokensLabel: "3M",
          tokensNote: "tokens/month",
          features: [
            "3M AI tokens per month",
            "All analysis types (security, performance…)",
            "ZIP / multi-file upload",
            "Real-time collaboration",
            "Advanced AI models",
            "Export & share reports",
            "Priority Support",
          ],
          icon: <Star />,
          popular: true,
        },
        {
          id: "enterprise",
          name: "Enterprise",
          price: "49.99",
          tagline: "Scale your entire team",
          priceId: "price_1Rx1kF9ddZe187yvEnterprisePlan123",
          tokensLabel: "∞",
          tokensNote: "unlimited tokens",
          features: [
            "Unlimited AI tokens",
            "Custom AI Training",
            "Team Collaboration",
            "Full API Access",
            "SSO / SAML",
            "Custom integrations",
            "Dedicated Account Manager",
            "White-label support",
          ],
          icon: <ShieldCheck />,
        },
      ],
    },
    it: {
      title: "Prezzi Semplici e Trasparenti",
      subtitle: "Scegli il piano adatto al tuo percorso di programmazione.",
      monthly: "/mese",
      getStarted: "Inizia Ora",
      popular: "Più Popolare",
      free: "Sempre gratis",
      secure: "Pagamenti sicuri con Stripe · Cancella in qualsiasi momento",
      tokensTitle: "Token AI",
      tokensPerMonth: "token/mese",
      plans: [
        {
          id: "free",
          name: "Gratis",
          price: "0",
          tagline: "Inizia a costruire gratis",
          tokensLabel: "100K",
          tokensNote: "token/mese",
          features: [
            "100K token AI al mese",
            "Motore Neurale Standard",
            "Accesso Web Editor",
            "Rilevamento errori base",
            "Evidenziazione sintassi",
            "Supporto Community",
          ],
          icon: <Zap />,
        },
        {
          id: "starter",
          name: "Starter",
          price: "9.99",
          tagline: "Per sviluppatori in crescita",
          priceId: "price_1Rx1kF9ddZe187yvStarterPlan123",
          tokensLabel: "1,5M",
          tokensNote: "token/mese",
          features: [
            "1,5M token AI al mese",
            "Review codice approfondite",
            "Upload file (.py, .js, .ts…)",
            "Export report (PDF)",
            "Coda prioritaria",
            "Supporto via Email",
          ],
          icon: <Sparkles />,
        },
        {
          id: "pro",
          name: "Pro",
          price: "19.99",
          tagline: "Per sviluppatori seri",
          priceId: "price_1Rx1kF9ddZe187yvProPlan123",
          tokensLabel: "3M",
          tokensNote: "token/mese",
          features: [
            "3M token AI al mese",
            "Tutti i tipi di analisi",
            "Upload ZIP e multi-file",
            "Collaborazione in tempo reale",
            "Modelli AI avanzati",
            "Export e condivisione report",
            "Supporto prioritario",
          ],
          icon: <Star />,
          popular: true,
        },
        {
          id: "enterprise",
          name: "Enterprise",
          price: "49.99",
          tagline: "Scala l'intero team",
          priceId: "price_1Rx1kF9ddZe187yvEnterprisePlan123",
          tokensLabel: "∞",
          tokensNote: "token illimitati",
          features: [
            "Token AI illimitati",
            "Training AI Personalizzato",
            "Collaborazione Team",
            "Accesso completo alle API",
            "SSO / SAML",
            "Integrazioni personalizzate",
            "Account Manager Dedicato",
            "Supporto White-label",
          ],
          icon: <ShieldCheck />,
        },
      ],
    },
  };

  const handleCheckout = async (plan: Plan) => {
    if (plan.price === "0") {
      window.location.href = "/register";
      return;
    }
    if (!sessionUser?.email) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent("/pricing#checkout")}`;
      return;
    }
    try {
      setLoading(plan.id);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId, planId: plan.id }),
      });
      const { sessionId, url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) {
        window.location.href = url;
      } else if (sessionId) {
        const stripe = await stripePromise;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: stripeError } = await (stripe as any).redirectToCheckout({ sessionId });
        if (stripeError) throw new Error(stripeError.message);
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Checkout fallito. Riprova.");
    } finally {
      setLoading(null);
    }
  };

  const current = t[language];

  return (
    <section
      id="prezzi"
      className="relative py-24 md:py-32 overflow-hidden bg-[#f8fafc]"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(251,113,133,0.04) 0%, transparent 70%)" }} />
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5"
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.25)",
              color: "#10b981",
            }}
          >
            <Sparkles size={12} />
            Piani di Prezzo
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-[#0f172a] mb-4"
          >
            {current.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[#475569] max-w-2xl mx-auto"
          >
            {current.subtitle}
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {current.plans.map((plan, i) => {
            const style = PLAN_STYLES[plan.id];
            const isLoading = loading === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -6 }}
                className={`relative flex flex-col rounded-3xl h-full border overflow-hidden transition-all duration-300 bg-white ${
                  plan.popular
                    ? "border-emerald-500 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/30 lg:-mt-4 lg:mb-4"
                    : "border-[#e2e8f0] hover:border-[#cbd5e1] shadow-sm hover:shadow-lg"
                }`}
              >
                {/* Header con gradiente per piano */}
                <div
                  className={`relative px-6 pt-6 pb-5 bg-gradient-to-br ${style.gradient} ${
                    plan.popular ? "" : "opacity-[0.97]"
                  }`}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 80% -20%, ${style.glow} 0%, transparent 60%)`,
                    }}
                  />
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg}`}
                        style={{ color: style.accent }}
                      >
                        {React.cloneElement(plan.icon as React.ReactElement<{ size?: number }>, { size: 18 })}
                      </div>
                      <div>
                        <p className={`font-bold ${style.nameText}`}>
                          {plan.name}
                        </p>
                        <p className={`text-xs mt-0.5 ${style.headerText}`}>
                          {plan.tagline}
                        </p>
                      </div>
                    </div>
                    {plan.popular && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-emerald-600 shadow">
                        <Sparkles size={9} />
                        {current.popular}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-col h-full p-6 pt-5">
                  {/* Price */}
                  <div className="flex items-end gap-1 mb-4">
                    <span className="text-3xl font-extrabold tracking-tight text-[#0f172a]">
                      {`€${plan.price}`}
                    </span>
                    {plan.price !== "0" && (
                      <span className="mb-1 text-sm text-[#64748b]">
                        {current.monthly}
                      </span>
                    )}
                  </div>

                  {/* Token highlight */}
                  <div
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 mb-4 ${style.tokensBadge}`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <Coins size={14} />
                      {current.tokensTitle}
                    </span>
                    <span className="text-sm font-extrabold">
                      {plan.tokensLabel}
                      <span className="ml-1 text-[10px] font-semibold opacity-70">
                        {plan.tokensNote}
                      </span>
                    </span>
                  </div>

                  <div className="mb-4 h-px w-full bg-[#e2e8f0]" />

                  {/* Features */}
                  <ul className="space-y-2.5 grow mb-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center ${style.featureCheck}`}
                        >
                          <Check size={11} strokeWidth={3} />
                        </span>
                        <span className="text-sm leading-snug text-[#475569]">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={loading !== null}
                    className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${style.btnClass} disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]`}
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        {current.getStarted}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 flex items-center justify-center gap-2 text-sm text-[#64748b]"
        >
          <Lock size={13} />
          {current.secure}
        </motion.p>
      </div>
    </section>
  );
};

export default Pricing;
