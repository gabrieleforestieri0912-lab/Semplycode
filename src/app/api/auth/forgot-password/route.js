import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 });
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({ message: 'Se l\'email esiste, riceverai le istruzioni per il reset.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Build reset link
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // If SMTP configuration exists, try to send a real email. Otherwise fallback to console.log
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
          secure: smtpPort === 465, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const mailOptions = {
          from: smtpFrom,
          to: user.email,
          subject: 'Reset password - Semplycode',
          text: `Hai richiesto il reset della password. Usa questo link per impostare una nuova password: ${resetUrl}\n\nIl link scadrà alle ${resetTokenExpiry.toISOString()}`,
          html: `<p>Hai richiesto il reset della password. Clicca sul link qui sotto per impostare una nuova password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Il link scadrà alle ${resetTokenExpiry.toISOString()}</p>`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
      } catch (mailError) {
        console.error('Error sending reset email, falling back to console.log. Error:', mailError);
        console.log('\n=== PASSWORD RESET LINK ===');
        console.log(`Email: ${user.email}`);
        console.log(`Link: ${resetUrl}`);
        console.log(`Expires: ${resetTokenExpiry.toISOString()}`);
        console.log('===========================\n');
      }
    } else {
      console.log('\n=== PASSWORD RESET LINK ===');
      console.log(`Email: ${user.email}`);
      console.log(`Link: ${resetUrl}`);
      console.log(`Expires: ${resetTokenExpiry.toISOString()}`);
      console.log('===========================\n');
    }

    return NextResponse.json({ message: 'Se l\'email esiste, riceverai le istruzioni per il reset.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
