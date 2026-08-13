import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/api-auth';

const LINK_TTL: jwt.SignOptions['expiresIn'] = '2m';

/**
 * Codice di collegamento webapp → estensione.
 * È un JWT a breve scadenza (2 minuti) e scopo singolo: l'utente loggato
 * sulla webapp lo copia dalla pagina /extension-link e lo incolla
 * nell'estensione, che lo scambia con un token normale (30gg).
 */
export function signLinkCode(email: string): string {
  return jwt.sign(
    { email: email.toLowerCase().trim(), purpose: 'extension-link' },
    getJwtSecret(),
    { expiresIn: LINK_TTL },
  );
}

export function verifyLinkCode(code: string): string | null {
  try {
    const payload = jwt.verify(code.trim(), getJwtSecret());
    if (
      typeof payload === 'object' &&
      payload &&
      (payload as { purpose?: unknown }).purpose === 'extension-link' &&
      typeof (payload as { email?: unknown }).email === 'string'
    ) {
      return (payload as { email: string }).email.toLowerCase().trim();
    }
    return null;
  } catch {
    return null;
  }
}
