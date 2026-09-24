import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { findUserByEmail, updateUser } from '@/lib/supabase/db';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json({ message: 'Se l\'email esiste, riceverai le istruzioni per il reset.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await updateUser(normalizedEmail, { reset_token: resetToken, reset_token_expiry: resetTokenExpiry });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://semplycode.vercel.app';
    const resetUrl = `${siteUrl}/reset-password?token=${resetToken}`;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || `no-reply@${siteUrl.replace(/^https?:\/\//, '') || 'semplycode.vercel.app'}`;

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
          to: user.email,
          subject: 'Reset password - Semplycode',
          text: `Hai richiesto il reset della password. Usa questo link: ${resetUrl}`,
          html: `<p>Hai richiesto il reset della password. Clicca sul link qui sotto:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        });
      } catch (mailError) {
        console.error('Error sending reset email:', mailError);
        console.log(`\n=== PASSWORD RESET LINK ===\nEmail: ${user.email}\nLink: ${resetUrl}\n===========================\n`);
      }
    } else {
      console.log(`\n=== PASSWORD RESET LINK ===\nEmail: ${user.email}\nLink: ${resetUrl}\n===========================\n`);
    }

    return NextResponse.json({ message: 'Se l\'email esiste, riceverai le istruzioni per il reset.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
