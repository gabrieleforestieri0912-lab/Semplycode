import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import nodemailer from 'nodemailer';
import { once as rateOnce } from '@/lib/rateLimiter';

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // max 3 requests per window per email

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 });

    await connectDB();

    const normalized = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalized });
    if (!user) {
      // Create a minimal user record so the code can be used to sign in later
      user = await User.create({ email: normalized });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.loginCode = code;
    user.loginCodeExpiry = expiry;
    await user.save();

    // Apply rate limit record (Redis-backed with in-memory fallback)
    const key = `sendcode:${normalized}`;
    const rl = await rateOnce(key, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX);
    if (!rl.allowed) {
      return NextResponse.json(
        { message: 'Troppi tentativi. Riprova più tardi.', remaining: rl.remaining, reset: rl.reset },
        { status: 429 }
      );
    }

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-login?email=${encodeURIComponent(normalized)}&code=${code}`;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || `no-reply@${process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '') || 'localhost'}`;

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });

        await transporter.sendMail({
          from: smtpFrom,
          to: normalized,
          subject: 'Il tuo codice di accesso Semplycode',
          text: `Il tuo codice di accesso: ${code}. Scade in 10 minuti.`,
          html: `<p>Il tuo codice di accesso: <strong>${code}</strong></p><p>Scade in 10 minuti.</p><p>Oppure clicca: <a href="${resetUrl}">Accedi</a></p>`,
        });
      } catch (err) {
        console.error('Invio email fallito:', err);
        console.log(`Fallback: codice ${code} per ${normalized}`);
      }
    } else {
      console.log(`LOGIN CODE (no SMTP): ${code} -> ${normalized}`);
    }

    // Return rate limit info so clients can sync cooldown UI
    return NextResponse.json({
      message: "Se l'email esiste, hai ricevuto un codice di accesso.",
      remaining: rl.remaining,
      reset: rl.reset,
    });
  } catch (error) {
    console.error('send-login-code error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
