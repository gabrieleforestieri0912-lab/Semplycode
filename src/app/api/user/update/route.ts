import { NextRequest, NextResponse } from 'next/server';
import { updateUser } from '@/lib/supabase/db';
import { getSession } from '@/lib/supabase/server';
import { findUserByEmail } from '@/lib/supabase/db';

export async function POST(req: NextRequest) {
  try {
    const supabaseSession = await getSession();
    const email = supabaseSession?.user?.email;
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName } = await req.json();
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'Nome e cognome sono obbligatori.' }, { status: 400 });
    }

    const user = await updateUser(email, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato.' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        plan: user.plan || 'free',
      },
    });
  } catch (error) {
    console.error('Update User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
