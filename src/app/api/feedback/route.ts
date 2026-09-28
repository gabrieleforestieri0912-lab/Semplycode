import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { once as rateOnce } from '@/lib/rateLimiter';

let resend: Resend | undefined;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

const FEEDBACK_TO = process.env.FEEDBACK_TO_EMAIL || 'gabriele.forestieri0912@gmail.com';
const FEEDBACK_FROM = process.env.FEEDBACK_FROM_EMAIL || 'Semplycode <onboarding@resend.dev>';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

const CATEGORIES = new Set(['general', 'bug', 'feature', 'support', 'other']);

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function POST(req: NextRequest) {
  try {
    const { name, email, category, message } = (await req.json()) as {
      name?: string;
      email?: string;
      category?: string;
      message?: string;
    };

    const cleanName = (name || '').trim().slice(0, 100);
    const cleanEmail = (email || '').trim().slice(0, 200);
    const cleanCategory = (category || 'general').trim();
    const cleanMessage = (message || '').trim().slice(0, 5000);

    if (!cleanName || !cleanEmail || !cleanMessage) {
      return NextResponse.json({ error: 'Nome, email e messaggio sono obbligatori.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'Email non valida.' }, { status: 400 });
    }
    if (!CATEGORIES.has(cleanCategory)) {
      return NextResponse.json({ error: 'Categoria non valida.' }, { status: 400 });
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';
    const rl = await rateOnce(`feedback:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Troppi feedback inviati. Riprova più tardi.', remaining: rl.remaining, reset: rl.reset },
        { status: 429 }
      );
    }

    if (!resend) {
      console.error('feedback error: RESEND_API_KEY mancante');
      return NextResponse.json({ error: 'Servizio email non configurato.', fallback: true }, { status: 503 });
    }

    const { error } = await resend.emails.send({
      from: FEEDBACK_FROM,
      to: [FEEDBACK_TO],
      replyTo: cleanEmail,
      subject: `[Semplycode] Feedback (${cleanCategory}) — ${cleanName}`,
      text:
        `Nome: ${cleanName}\n` +
        `Email: ${cleanEmail}\n` +
        `Categoria: ${cleanCategory}\n\n` +
        `Messaggio:\n${cleanMessage}`,
      html:
        `<p><strong>Nome:</strong> ${esc(cleanName)}<br/>` +
        `<strong>Email:</strong> ${esc(cleanEmail)}<br/>` +
        `<strong>Categoria:</strong> ${esc(cleanCategory)}</p>` +
        `<p><strong>Messaggio:</strong></p>` +
        `<p>${esc(cleanMessage).replace(/\n/g, '<br/>')}</p>`,
    });

    if (error) {
      console.error('feedback resend error:', error);
      return NextResponse.json({ error: 'Invio non riuscito. Riprova più tardi.', fallback: true }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('feedback error:', error);
    return NextResponse.json(
      {
        error: 'Errore interno del server',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
