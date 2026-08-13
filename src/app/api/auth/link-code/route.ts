import { NextRequest, NextResponse } from 'next/server';
import { verifyLinkCode } from '@/lib/linkCode';
import { signExtensionToken } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'code è obbligatorio' }, { status: 400 });
    }

    const email = verifyLinkCode(code);
    if (!email) {
      return NextResponse.json(
        { error: 'Codice non valido o scaduto. Generane uno nuovo dalla webapp.' },
        { status: 401 },
      );
    }

    const token = signExtensionToken(email);
    return NextResponse.json({ token, user: { email } });
  } catch (error) {
    console.error('POST /api/auth/link-code error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
