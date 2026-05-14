import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName } = await req.json();
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'Nome e cognome sono obbligatori.' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { email: token.email },
      { firstName: firstName.trim(), lastName: lastName.trim() },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato.' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        plan: user.plan || 'free',
      },
    });
  } catch (error) {
    console.error('Update User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}