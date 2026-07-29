import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { once as rateOnce } from '@/lib/rateLimiter';
import { findUserByEmail, createUser, updateUser } from '@/lib/supabase/db';

let resend: Resend | undefined;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 3;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 });

    const normalized = email.toLowerCase().trim();
    let user = await findUserByEmail(normalized);
    if (!user) {
      user = await createUser({ email: normalized });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await updateUser(normalized, { login_code: code, login_code_expiry: expiry });

    const key = `sendcode:${normalized}`;
    const rl = await rateOnce(key, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX);
    if (!rl.allowed) {
      return NextResponse.json(
        { message: 'Troppi tentativi. Riprova più tardi.', remaining: rl.remaining, reset: rl.reset },
        { status: 429 }
      );
    }

    if (resend) {
      try {
        await resend.emails.send({
          from: 'Semplycode <onboarding@resend.dev>',
          to: normalized,
          subject: 'Il tuo codice di accesso Semplycode',
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #111827; margin-bottom: 8px;">Il tuo codice di accesso</h2>
              <p style="font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #10b981; margin: 16px 0;">
                ${code}
              </p>
              <p style="color: #374151; font-size: 15px;">
                Questo codice scade tra <strong>10 minuti</strong>.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                Se non hai richiesto questo codice, puoi ignorare questa email.
              </p>
            </div>
          `,
        });
      } catch (err) {
        console.error('Errore invio email con Resend:', err);
        console.log(`LOGIN CODE (Resend fallito): ${code} -> ${normalized}`);
      }
    } else {
      console.log(`LOGIN CODE (Resend non configurato): ${code} -> ${normalized}`);
    }

    return NextResponse.json({
      message: "Se l'email esiste, hai ricevuto un codice di accesso.",
      remaining: rl.remaining,
      reset: rl.reset,
    });
  } catch (error) {
    console.error('send-login-code error:', error);
    return NextResponse.json(
      {
        error: 'Errore interno del server',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
