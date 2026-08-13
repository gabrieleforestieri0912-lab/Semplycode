import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/supabase/db';
import { createClient } from '@/lib/supabase/server';
import { signExtensionToken } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) return NextResponse.json({ error: 'Email e codice obbligatori' }, { status: 400 });

    const normalized = email.toLowerCase().trim();
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalized,
      token: code,
      type: 'email',
    });

    if (error || !data.session) {
      return NextResponse.json({ error: 'Codice non valido o scaduto' }, { status: 401 });
    }

    const user = await findUserByEmail(normalized);
    if (!user) {
      await createUser({ email: normalized });
    }

    // Emette il JWT Bearer usato dall'estensione Chrome (la webapp
    // continua ad autenticarsi tramite la sessione a cookie Supabase).
    const token = signExtensionToken(normalized);

    return NextResponse.json({ success: true, token, user: { email: normalized } });
  } catch (error) {
    console.error('verify-login-code error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
