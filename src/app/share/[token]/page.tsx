'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

interface SharedPayload {
  title?: string;
  language?: string;
  analysis: string;
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
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
      .catch(() => setError('Impossibile caricare la condivisione'));
  }, [token]);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 md:px-12 py-12">
        <Link href="/" className="text-sm text-emerald-400 hover:underline mb-6 inline-block">
          ← Torna a Semplycode
        </Link>
        {error && <p className="text-red-500">{error}</p>}
        {data && (
          <article className="prose max-w-none">
            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">
              {data.title || 'Analisi condivisa'}
            </h1>
            {data.language && (
              <p className="text-xs text-[#64748b] mb-6">Linguaggio: {data.language}</p>
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
