import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/ensureEnv';

export async function POST(req) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) return NextResponse.json({ error: 'Email e codice obbligatori' }, { status: 400 });

    await connectDB();
    const normalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalized });
    if (!user) return NextResponse.json({ error: 'Codice non valido' }, { status: 401 });

    if (!user.loginCode || !user.loginCodeExpiry || user.loginCode !== code || user.loginCodeExpiry < Date.now()) {
      return NextResponse.json({ error: 'Codice non valido o scaduto' }, { status: 401 });
    }

    // Clear code
    user.loginCode = undefined;
    user.loginCodeExpiry = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return NextResponse.json({ token, user: { email: user.email, firstName: user.firstName, lastName: user.lastName } });
  } catch (error) {
    console.error('verify-login-code error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
