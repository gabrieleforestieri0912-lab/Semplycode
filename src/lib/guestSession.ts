import { cookies } from 'next/headers';
import crypto from 'crypto';

const GUEST_COOKIE = 'semplycode_guest_id';

export function generateGuestId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function getOrCreateGuestId(): Promise<string | null> {
  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return existing;
  return null;
}

export function guestCookieHeader(guestId: string): string {
  const maxAge = 60 * 60 * 24 * 365;
  return `${GUEST_COOKIE}=${guestId}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly`;
}

export { GUEST_COOKIE };
