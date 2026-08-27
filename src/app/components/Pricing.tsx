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

interface Plan {
  id: string;
  name: string;
  price: string;
  tagline: string;
  priceId?: string;
  features: string[];
  icon: React.ReactElement;
  popular?: boolean;
}

interface SectionTranslation {
  titleA: string;
  titleB: string;
  subtitle: string;
  monthly: string;
  getStarted: string;
  popular: string;
  secure: string;
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
      "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/25 active:scale-[0.97]",
  },
};

const Pricing = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);
  const { user: sessionUser } = useSupabaseSession();
  const { toast, showToast } = useToast();

  const t: Record<string, SectionTranslation> = {
    en: {
      titleA: "Simple,",
      titleB: "transparent pricing",
      subtitle: "Pick the plan that fits your coding journey.",
      monthly: "/mo",
      getStarted: "Get Started",
      popular: "Most Popular",
      secure: "Secure payments via Stripe · Cancel anytime",
      plans: [
        {
          id: "free",
          name: "Free",
          price: "0",
          tagline: "Start building for free",
          features: [
            "100 AI tokens per month",
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
          features: [
            "1500 AI tokens per month",
            "Deep Code Reviews",
            "File upload (.py, .js, .ts…)",
            "Export reports (PDF)",
            "Priority queue",
            "Email Support",
          ],
          icon: <Rocket />,
        },
        {
          id: "pro",
          name: "Pro",
          price: "19.99",
          tagline: "For serious developers",
          priceId: "price_1Rx1kF9ddZe187yvProPlan123",
          features: [
            "3000 AI tokens per month",
            "All analysis types (security, performance…)",
            "ZIP / multi-file upload",
            "Real-time collaboration",
            "Advanced AI models",
            "Export & share reports",
            "Priority Support",
          ],
          icon: <Crown />,
          popular: true,
        },
        {
          id: "enterprise",
          name: "Enterprise",
          price: "49.99",
          tagline: "Scale your entire team",
          priceId: "price_1Rx1kF9ddZe187yvEnterprisePlan123",
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
          icon: <Building2 />,
        },
      ],
    },
    it: {
      titleA: "Prezzi semplici,",
      titleB: "senza sorprese",
      subtitle: "Scegli il piano adatto al tuo percorso di programmazione.",
      monthly: "/mese",
      getStarted: "Inizia Ora",
      popular: "Più Popolare",
      secure: "Pagamenti sicuri con Stripe · Cancella in qualsiasi momento",
      plans: [
        {
          id: "free",
          name: "Gratis",
          price: "0",
          tagline: "Inizia a costruire gratis",
          features: [
            "100 token AI al mese",
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
          features: [
            "1500 token AI al mese",
            "Review codice approfondite",
            "Upload file (.py, .js, .ts…)",
            "Export report (PDF)",
            "Coda prioritaria",
            "Supporto via Email",
          ],
          icon: <Rocket />,
        },
        {
          id: "pro",
          name: "Pro",
          price: "19.99",
          tagline: "Per sviluppatori seri",
          priceId: "price_1Rx1kF9ddZe187yvProPlan123",
          features: [
            "3000 token AI al mese",
            "Tutti i tipi di analisi",
            "Upload ZIP e multi-file",
            "Collaborazione in tempo reale",
            "Modelli AI avanzati",
            "Export e condivisione report",
            "Supporto prioritario",
          ],
          icon: <Crown />,
          popular: true,
        },
        {
          id: "enterprise",
          name: "Enterprise",
          price: "49.99",
          tagline: "Scala l'intero team",
          priceId: "price_1Rx1kF9ddZe187yvEnterprisePlan123",
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
          icon: <Building2 />,
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
      window.location.href = `/login?callbackUrl=${encodeURIComponent("/#prezzi")}`;
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
      showToast("Checkout fallito. Riprova.", "error");
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
      {/* Background decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px]"
          style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)" }}
        />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 relative"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-15" />
            <span className="absolute inset-px rounded-full bg-white" />
            <Sparkles size={11} className="relative text-emerald-500" />
            <span className="relative text-emerald-600">Piani di Prezzo</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black tracking-tight text-[#0f172a] mb-5"
          >
            {current.titleA}{" "}
            <span className="text-gradient">
              {current.titleB}
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-[#475569] max-w-2xl mx-auto"
          >
            {current.subtitle}
          </motion.p>
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {current.plans.map((plan, i) => {
            const style = PLAN_STYLES[plan.id];
            const isLoading = loading === plan.id;

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

                {/* Gradient border wrapper */}
                <div
                  className={`relative h-full rounded-3xl p-px transition-all duration-500 ${
                    plan.popular
                      ? "bg-gradient-to-b from-emerald-400 via-teal-300 to-emerald-500 shadow-xl shadow-emerald-500/20"
                      : "bg-[#e2e8f0] group-hover:bg-gradient-to-br group-hover:from-emerald-300 group-hover:via-teal-300 group-hover:to-emerald-400"
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
                    <div className="relative flex flex-col h-full p-6 pt-7">
                      {/* Plan name + icon */}
                      <div className="flex items-center gap-3 mb-6">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                          style={{
                            background: `${style.accent}14`,
                            border: `1px solid ${style.accent}28`,
                            color: style.accent,
                            boxShadow: `0 8px 20px -8px ${style.glow}`,
                          }}
                        >
                          {React.cloneElement(plan.icon as React.ReactElement<{ size?: number }>, { size: 20 })}
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

                      {/* Price */}
                      <div className="flex items-end gap-1 mb-6 min-h-[56px]">
                        <span className="text-xl font-medium text-[#64748b] leading-none mb-1.5">€</span>
                        <span className="text-5xl font-black tracking-tight text-[#0f172a] leading-none">
                          {plan.price}
                        </span>
                        {plan.price !== "0" && (
                          <span className="mb-1 text-sm font-medium text-[#64748b]">
                            {current.monthly}
                          </span>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-2.5 grow mb-6">
                        {plan.features.map((feature, j) => (
                          <li key={j} className="flex items-start gap-3">
                            <span
                              className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: `${style.accent}1a`, color: style.accent }}
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
                        className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${style.btnClass}`}
                      >
                        {isLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            {current.getStarted}
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
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

        {/* Secure note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-14 flex items-center justify-center gap-2 text-sm text-[#64748b]"
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
