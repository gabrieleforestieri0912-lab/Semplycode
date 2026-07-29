import { NextRequest } from 'next/server';

export const GUEST_DAILY_LIMIT = 3;
export const FREE_DAILY_LIMIT = 10;

export function isPreviousDay(date: Date | null | undefined): boolean {
  if (!date) return true;
  const current = new Date();
  const previous = new Date(date);
  return current.toDateString() !== previous.toDateString();
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
