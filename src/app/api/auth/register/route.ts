import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { findUserByEmail, createUser } from '@/lib/supabase/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await req.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await findUserByEmail(email.toLowerCase().trim());
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const forwardedHost = req.headers.get('x-forwarded-host');
    const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
    const siteUrl = forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
          ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
          : 'https://semplycode.vercel.app');
    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`.trim(),
        },
        emailRedirectTo: `${siteUrl}/api/auth/callback`,
      },
    });

    if (authError) {
      console.error('Supabase signup error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await createUser({
      email: email.toLowerCase().trim(),
      first_name: firstName,
      last_name: lastName,
      password: hashedPassword,
    });

    return NextResponse.json({
      message: 'Registrazione avvenuta! Controlla la tua email per confermare l\'account.',
      needsEmailConfirmation: true,
      user: { firstName: newUser.first_name, lastName: newUser.last_name, email: newUser.email },
    }, { status: 201 });
  } catch (error) {
    console.error('Registration API Error:', error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
