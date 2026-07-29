import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, updateUser } from '@/lib/supabase/db';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/ensureEnv';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) return NextResponse.json({ error: 'Email e codice obbligatori' }, { status: 400 });

    const normalized = email.toLowerCase().trim();
    const user = await findUserByEmail(normalized);
    if (!user) return NextResponse.json({ error: 'Codice non valido' }, { status: 401 });

    const now = new Date();
    const expiry = user.login_code_expiry ? new Date(user.login_code_expiry) : null;

    if (!user.login_code || !expiry || user.login_code !== code || expiry < now) {
      return NextResponse.json({ error: 'Codice non valido o scaduto' }, { status: 401 });
    }

    await updateUser(normalized, { login_code: null, login_code_expiry: null });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return NextResponse.json({
      token,
      user: { email: user.email, firstName: user.first_name, lastName: user.last_name },
    });
  } catch (error) {
    console.error('verify-login-code error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
