'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { useLanguage } from '../../../context/LanguageContext';

interface SharedPayload {
  title?: string;
  language?: string;
  analysis: string;
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const { language } = useLanguage();
  const t = {
    it: {
      loadError: 'Impossibile caricare la condivisione',
      back: '← Torna a Semplycode',
      sharedTitle: 'Analisi condivisa',
      languageLabel: 'Linguaggio:',
    },
    en: {
      loadError: 'Could not load the shared analysis',
      back: '← Back to Semplycode',
      sharedTitle: 'Shared analysis',
      languageLabel: 'Language:',
    },
  }[language];
  const [data, setData] = useState<SharedPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/share/${token}`)
      .then((r) => r.json())
      .then((j: { error?: string; payload?: SharedPayload }) => {
        if (j.error) setError(j.error);
        else setData(j.payload!);
      })
      .catch(() => setError(t.loadError));
  }, [token, t.loadError]);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 md:px-12 py-12">
        <Link href="/" className="text-sm text-emerald-400 hover:underline mb-6 inline-block">
          {t.back}
        </Link>
        {error && <p className="text-red-500">{error}</p>}
        {data && (
          <article className="prose max-w-none">
            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">
              {data.title || t.sharedTitle}
            </h1>
            {data.language && (
              <p className="text-xs text-[#64748b] mb-6">{t.languageLabel} {data.language}</p>
            )}
            <div className="ai-response-markdown text-sm text-[#334155]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.analysis}</ReactMarkdown>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
