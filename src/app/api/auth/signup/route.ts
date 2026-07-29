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

    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`.trim(),
        },
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
      message: 'User registered successfully!',
      user: { firstName: newUser.first_name, lastName: newUser.last_name, email: newUser.email },
    }, { status: 201 });
  } catch (error) {
    console.error('Registration API Error:', error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
