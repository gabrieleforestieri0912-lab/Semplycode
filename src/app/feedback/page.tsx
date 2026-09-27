'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import CodeFloatBackground from '@/app/components/CodeFloatBackground';
import { useLanguage } from '../../context/LanguageContext';

function HeroBackground() {
  return (
    <>
      {/* Background orbs - uguali a Hero */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.06) 40%, transparent 68%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute top-1/2 right-[-80px] w-[360px] h-[360px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* Background codice fluttuante (decorativo, aria-hidden) - uguale a Hero */}
      <CodeFloatBackground />
    </>
  );
}

interface FormData {
  name: string;
  email: string;
  category: string;
  message: string;
}

interface Category {
  value: string;
  label: string;
}

export default function FeedbackPage() {
  const { language } = useLanguage();
  const t = {
    it: {
      thanks: 'Grazie per il tuo feedback!',
      thanksBody: "Il tuo messaggio è stato preparato nel client email. Inviacelo per completare l'invio.",
      backHome: 'Torna alla home',
      goBack: 'Torna indietro',
      title: 'Invia un Feedback',
      subtitle: 'Il tuo parere è importante per noi. Compila il form e inviaci le tue impressioni, suggerimenti o segnalazioni.',
      name: 'Nome',
      namePh: 'Il tuo nome',
      emailPh: 'tua@email.com',
      category: 'Categoria',
      message: 'Il tuo messaggio',
      messagePh: 'Descrivi il tuo feedback, suggerimento o problema...',
      sending: 'Preparazione invio...',
      send: 'Invia Feedback',
      footnote: 'Cliccando "Invia" si aprirà il tuo client email con il messaggio già precompilato.',
      categories: ['Feedback generale', 'Segnalazione bug', 'Richiesta funzionalità', 'Richiesta supporto', 'Altro'] as string[],
    },
    en: {
      thanks: 'Thanks for your feedback!',
      thanksBody: 'Your message has been prepared in your email client. Send it to complete the submission.',
      backHome: 'Back to home',
      goBack: 'Go back',
      title: 'Send Feedback',
      subtitle: 'Your opinion matters to us. Fill in the form and send us your thoughts, suggestions or reports.',
      name: 'Name',
      namePh: 'Your name',
      emailPh: 'you@email.com',
      category: 'Category',
      message: 'Your message',
      messagePh: 'Describe your feedback, suggestion or issue...',
      sending: 'Preparing...',
      send: 'Send Feedback',
      footnote: 'Clicking "Send" will open your email client with the message already pre-filled.',
      categories: ['General feedback', 'Bug report', 'Feature request', 'Support request', 'Other'] as string[],
    },
  }[language];
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    category: 'general',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: Category[] = [
    { value: 'general', label: t.categories[0] },
    { value: 'bug', label: t.categories[1] },
    { value: 'feature', label: t.categories[2] },
    { value: 'support', label: t.categories[3] },
    { value: 'other', label: t.categories[4] },
  ];

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const subject = encodeURIComponent(`[Semplycode] Feedback - ${formData.category}`);
    const body = encodeURIComponent(
      `Nome: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Categoria: ${formData.category}\n\n` +
      `Messaggio:\n${formData.message}`
    );

    window.location.href = `mailto:gabriele.forestieri0912@gmail.com?subject=${subject}&body=${body}`;

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Navbar />
        <div className="grow flex items-center justify-center px-4 relative overflow-hidden">
          <HeroBackground />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 max-w-md w-full text-center py-12 sm:py-16"
          >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-[#0f172a] mb-3">{t.thanks}</h1>
          <p className="text-[#64748b] mb-8">
            {t.thanksBody}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backHome}
          </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />
      <div className="grow py-12 sm:py-16 px-4 sm:px-6 relative overflow-hidden">
        <HeroBackground />
        <div className="relative z-10 max-w-2xl 3xl:max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#64748b] hover:text-primary mb-8 transition-colors text-sm font-medium min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.goBack}
        </Link>

        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl 3xl:text-5xl font-bold text-[#0f172a] mb-3">{t.title}</h1>
          <p className="text-[#475569] text-base sm:text-lg 3xl:text-xl">
            {t.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#e2e8f0] rounded-2xl p-5 sm:p-8 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">{t.name}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[#0f172a] placeholder:text-[#64748b] focus:outline-none focus:border-primary"
                placeholder={t.namePh}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[#0f172a] placeholder:text-[#64748b] focus:outline-none focus:border-primary"
                placeholder={t.emailPh}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">{t.category}</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[#0f172a] focus:outline-none focus:border-primary"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">{t.message}</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[#0f172a] placeholder:text-[#64748b] focus:outline-none focus:border-primary resize-y"
              placeholder={t.messagePh}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-emerald-600 disabled:opacity-70 transition-colors text-white font-semibold py-4 rounded-xl text-base"
          >
            {isSubmitting ? (
              t.sending
            ) : (
              <>
                <Send className="w-5 h-5" />
                {t.send}
              </>
            )}
          </button>

          <p className="text-xs text-center text-[#64748b]">
            {t.footnote}
          </p>
        </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
