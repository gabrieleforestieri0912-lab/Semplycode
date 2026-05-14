'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Star, ShieldCheck, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { loadStripe } from '@stripe/stripe-js';
import { useSession } from 'next-auth/react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const Pricing = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(null);
  const { data: session, status } = useSession();

  const t = {
    en: {
      title: "Simple, Transparent Pricing",
      subtitle: "Choose the plan that's right for your coding journey.",
      monthly: "/month",
      getStarted: "Get Started",
      popular: "Most Popular",
      plans: [
        {
          id: 'free',
          name: "Free",
          price: "0",
          features: ["10 AI Analyses per day", "Standard Neural Engine", "Web Editor access", "Community Support"],
          icon: <Zap className="text-slate-400" />
        },
        {
          id: 'pro',
          name: "Pro",
          price: "19",
          priceId: 'price_1Rx1kF9ddZe187yvProPlan123',
          features: ["Unlimited AI Analyses", "Advanced Neural Core", "Offline Local Export", "Priority Support", "Advanced Debugging"],
          icon: <Star className="text-amber-500" />,
          popular: true
        },
        {
          id: 'enterprise',
          name: "Enterprise",
          price: "49",
          priceId: 'price_1Rx1kF9ddZe187yvEnterprisePlan123',
          features: ["Custom AI Training", "Team Collaboration", "API Access", "Dedicated Account Manager", "White-label support"],
          icon: <ShieldCheck className="text-blue-500" />
        }
      ]
    },
    it: {
      title: "Prezzi Semplici e Trasparenti",
      subtitle: "Scegli il piano giusto per il tuo percorso di programmazione.",
      monthly: "/mese",
      getStarted: "Inizia Ora",
      popular: "Più Popolare",
      plans: [
        {
          id: 'free',
          name: "Gratis",
          price: "0",
          features: ["10 Analisi AI al giorno", "Motore Neurale Standard", "Accesso Web Editor", "Supporto Community"],
          icon: <Zap className="text-slate-400" />
        },
        {
          id: 'pro',
          name: "Pro",
          price: "19",
          priceId: 'price_1Rx1kF9ddZe187yvProPlan123',
          features: ["Analisi AI Illimitate", "Advanced Neural Core", "Esportazione Locale", "Supporto Prioritario", "Debugging Avanzato"],
          icon: <Star className="text-amber-500" />,
          popular: true
        },
        {
          id: 'enterprise',
          name: "Enterprise",
          price: "49",
          priceId: 'price_1Rx1kF9ddZe187yvEnterprisePlan123',
          features: ["Training AI Personalizzato", "Collaborazione Team", "Accesso alle API", "Account Manager Dedicato", "Supporto White-label"],
          icon: <ShieldCheck className="text-blue-500" />
        }
      ]
    }
  };

  const handleCheckout = async (plan) => {
    if (plan.id === 'free') {
      window.location.href = '/register';
      return;
    }

    if (session?.user?.email) {
    } else {
      const returnUrl = `/pricing#checkout`;
      window.location.href = `/login?callbackUrl=${encodeURIComponent(returnUrl)}`;
      return;
    }

    try {
      setLoading(plan.id);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          planId: plan.id,
        }),
      });

      const { sessionId, url, error } = await response.json();
      
      if (error) throw new Error(error);

      if (url) {
        window.location.href = url;
      } else if (sessionId) {
        const stripe = await stripePromise;
        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
        
        if (stripeError) throw new Error(stripeError.message);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Checkout fallito. Riprova.');
    } finally {
      setLoading(null);
    }
  };

  const current = t[language];

  return (
    <section id="pricing" className="py-32 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-violet-500/5 rounded-full blur-[180px]"></div>
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #064e3b 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="container mx-auto px-8 md:px-12 relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8 shadow-lg shadow-primary/5"
          >
            <Star size={12} fill="currentColor" />
            Piani di Prezzo
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight"
          >
            {current.title}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            {current.subtitle}
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {current.plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`group relative flex flex-col bg-white/70 backdrop-blur-xl rounded-3xl p-10 transition-all duration-500 hover:-translate-y-3 ${
                plan.popular
                ? 'border-2 border-primary shadow-[0_25px_60px_rgba(6,78,59,0.25)] scale-[1.02] z-20'
                : 'border border-gray-200/50 shadow-[0_10px_40px_rgba(0,0,0,0.08)] hover:border-primary/30 hover:shadow-[0_30px_60px_rgba(6,78,59,0.18)] z-10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gradient-to-r from-primary to-emerald-500 text-white text-xs font-bold uppercase tracking-widest py-2.5 px-6 rounded-full shadow-xl shadow-primary/30">
                  <Star size={10} fill="white" />
                  {current.popular}
                </div>
              )}

              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="relative mb-10 pt-4">
                <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                  plan.popular ? 'bg-gradient-to-br from-primary to-emerald-500 shadow-xl shadow-primary/30' : 'bg-gradient-to-br from-slate-100 to-slate-50'
                }`}>
                  {React.cloneElement(plan.icon, { 
                    className: plan.popular ? 'text-white' : plan.icon.props.className,
                    size: 36 
                  })}
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-black text-gray-900 tracking-tight">{plan.price}</span>
                  <span className="text-gray-500 font-semibold ml-2">{language === 'it' ? 'EUR' : 'EUR'}{current.monthly}</span>
                </div>
              </div>

              <div className="flex-grow mb-10 relative">
                <ul className="space-y-5">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-4 text-base text-gray-700">
                      <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        plan.popular 
                        ? 'bg-primary/15 text-primary' 
                        : 'bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                      }`}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => handleCheckout(plan)}
                disabled={loading !== null}
                className={`relative w-full py-5 rounded-2xl text-base font-bold transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden ${
                  plan.popular 
                  ? 'bg-gradient-to-r from-primary via-primary to-emerald-500 text-white hover:shadow-2xl hover:shadow-primary/30 group-hover:scale-[1.02]' 
                  : 'bg-gray-900 text-white hover:bg-gray-800 shadow-xl shadow-gray-200 hover:shadow-xl hover:scale-[1.02]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="relative z-10">
                  {loading === plan.id ? <Loader2 className="animate-spin" size={18} /> : current.getStarted}
                </span>
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-gray-500 text-base flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Pagamenti sicuri con Stripe
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
