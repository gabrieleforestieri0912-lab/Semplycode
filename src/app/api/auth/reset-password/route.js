import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  try {
    const { token, password, confirmPassword } = await req.json();

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Tutti i campi sono obbligatori' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Le password non corrispondono' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La password deve contenere almeno 6 caratteri' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });

    if (!user) {
      return NextResponse.json({ error: 'Token non valido o scaduto' }, { status: 400 });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    console.log(`Password reset successful for: ${user.email}`);

    return NextResponse.json({ message: 'Password aggiornata con successo' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
