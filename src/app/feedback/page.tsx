'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    category: 'general',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: Category[] = [
    { value: 'general', label: 'Feedback generale' },
    { value: 'bug', label: 'Segnalazione bug' },
    { value: 'feature', label: 'Richiesta funzionalità' },
    { value: 'support', label: 'Richiesta supporto' },
    { value: 'other', label: 'Altro' },
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
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-[#0f172a] mb-3">Grazie per il tuo feedback!</h1>
          <p className="text-[#64748b] mb-8">
            Il tuo messaggio è stato preparato nel client email. Inviacelo per completare l&apos;invio.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-2xl 3xl:max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#64748b] hover:text-primary mb-8 transition-colors text-sm font-medium min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna indietro
        </Link>

        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl 3xl:text-5xl font-bold text-[#0f172a] mb-3">Invia un Feedback</h1>
          <p className="text-[#475569] text-base sm:text-lg 3xl:text-xl">
            Il tuo parere è importante per noi. Compila il form e inviaci le tue impressioni, suggerimenti o segnalazioni.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#e2e8f0] rounded-2xl p-5 sm:p-8 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">Nome</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[#0f172a] placeholder:text-[#64748b] focus:outline-none focus:border-primary"
                placeholder="Il tuo nome"
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
                placeholder="tua@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">Categoria</label>
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
            <label className="block text-sm font-medium text-[#475569] mb-2">Il tuo messaggio</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[#0f172a] placeholder:text-[#64748b] focus:outline-none focus:border-primary resize-y"
              placeholder="Descrivi il tuo feedback, suggerimento o problema..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-emerald-600 disabled:opacity-70 transition-colors text-white font-semibold py-4 rounded-xl text-base"
          >
            {isSubmitting ? (
              'Preparazione invio...'
            ) : (
              <>
                <Send className="w-5 h-5" />
                Invia Feedback
              </>
            )}
          </button>

          <p className="text-xs text-center text-[#64748b]">
            Cliccando &quot;Invia&quot; si aprirà il tuo client email con il messaggio già precompilato.
          </p>
        </form>
      </div>
    </div>
  );
}
