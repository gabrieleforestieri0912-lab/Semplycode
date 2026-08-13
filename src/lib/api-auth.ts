import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/supabase/server';

const JWT_SECRET = process.env.JWT_SECRET || '';
const TOKEN_TTL: jwt.SignOptions['expiresIn'] = '30d';

export interface AuthUser {
  email: string;
}

export function getJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
  return JWT_SECRET;
}

/**
 * Firma un token Bearer per l'estensione Chrome.
 * L'estensione non può usare i cookie di sessione (CORS `*`), quindi
 * autentica le API con un JWT firmato con JWT_SECRET.
 */
export function signExtensionToken(email: string): string {
  return jwt.sign({ email: email.toLowerCase().trim() }, getJwtSecret(), {
    expiresIn: TOKEN_TTL,
  });
}

/**
 * Risolve l'identità dell'utente per una richiesta API:
 * 1. `Authorization: Bearer <jwt>` (estensione Chrome) — JWT firmato da noi
 * 2. Sessione cookie Supabase (webapp)
 *
 * Ritorna l'email normalizzata oppure null (richiesta anonima).
 */
/**
 * Valida un access token Supabase (rilasciato da Supabase Auth) e ne
 * ricava l'email. Usato quando il Bearer non è il nostro JWT custom:
 * abilita in futuro Realtime/RLS native dall'estensione.
 */
async function validateSupabaseToken(token: string): Promise<string | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    const supabase = createSupabaseClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await supabase.auth.getUser();
    const email = data?.user?.email;
    return email ? email.toLowerCase().trim() : null;
  } catch {
    return null;
  }
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  // 1. Bearer token (estensione): nostro JWT custom oppure token Supabase
  const authorization = req.headers.get('authorization');
  if (authorization && authorization.startsWith('Bearer ')) {
    const token = authorization.slice('Bearer '.length).trim();
    if (!token) return null;

    // 1a. JWT custom firmato da noi
    try {
      const payload = jwt.verify(token, getJwtSecret());
      if (typeof payload === 'object' && payload && typeof (payload as { email?: unknown }).email === 'string') {
        return { email: (payload as { email: string }).email.toLowerCase().trim() };
      }
    } catch {
      /* non è il nostro JWT — proviamo con Supabase */
    }

    // 1b. Access token Supabase
    const email = await validateSupabaseToken(token);
    if (email) return { email };
    return null;
  }

  // 2. Sessione cookie (webapp)
  const session = await getSession();
  const email = session?.user?.email;
  if (email) return { email: email.toLowerCase().trim() };
  return null;
}

export function unauthorizedResponse(message = 'Non autenticato'): Response {
  return Response.json({ error: message }, { status: 401 });
}
