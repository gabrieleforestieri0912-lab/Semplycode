import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { once as rateOnce } from '@/lib/rateLimiter';
import { findUserByEmail, createUser } from '@/lib/supabase/db';
import { createClient } from '@/lib/supabase/server';

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
    const forwardedHost = req.headers.get('x-forwarded-host');
    const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
    const siteUrl = forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
          ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
          : 'https://semplycode.vercel.app');
    const supabase = await createClient();

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo: `${siteUrl}/login`,
      },
    });

    if (otpError) {
      console.error('Supabase OTP error:', otpError);
      return NextResponse.json({ error: otpError.message }, { status: 400 });
    }

    const rl = await rateOnce(`login-code:${normalized}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX);

    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Attendi prima di richiedere un nuovo codice.', remaining: rl.remaining, reset: rl.reset },
        { status: 429 }
      );
    }

    const user = await findUserByEmail(normalized);
    if (!user) {
      await createUser({ email: normalized });
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
