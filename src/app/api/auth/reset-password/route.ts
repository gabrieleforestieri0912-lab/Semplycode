import { NextRequest, NextResponse } from 'next/server';
import { findUserByResetToken, updateUser } from '@/lib/supabase/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
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

    const user = await findUserByResetToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Token non valido o scaduto' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await updateUser(user.email, {
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null,
    });

    console.log(`Password reset successful for: ${user.email}`);

    return NextResponse.json({ message: 'Password aggiornata con successo' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
