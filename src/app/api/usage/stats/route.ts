import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { peek } from '@/lib/rateLimiter';
import {
  GUEST_DAILY_LIMIT,
  FREE_DAILY_LIMIT,
  isPreviousDay,
} from '@/lib/usageLimits';
import { GUEST_COOKIE, generateGuestId } from '@/lib/guestSession';
import { getAuthUser } from '@/lib/api-auth';
import { findUserByEmail, updateUser, countChatsByUserId } from '@/lib/supabase/db';

const GUEST_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const email = authUser?.email || null;

    if (email) {
      const user = await findUserByEmail(email);
      if (!user) {
        return NextResponse.json({ error: 'Utente non trovato.' }, { status: 404 });
      }

      const lastReset = user.daily_analyses_last_reset ? new Date(user.daily_analyses_last_reset) : new Date(0);
      if (isPreviousDay(lastReset)) {
        await updateUser(email, { daily_analyses_count: 0, daily_analyses_last_reset: new Date().toISOString() });
      }

      const chats = await countChatsByUserId(user.email);
      const plan = user.plan || 'free';
      const analyses = user.daily_analyses_count || 0;
      const dailyLimit = plan === 'free' ? FREE_DAILY_LIMIT : null;
      const remainingAnalyses =
        plan === 'free' ? Math.max(FREE_DAILY_LIMIT - analyses, 0) : null;

      return NextResponse.json({
        authenticated: true,
        plan,
        chats,
        analyses,
        remainingAnalyses,
        dailyLimit,
      });
    }

    const cookieStore = await cookies();
    let guestId = cookieStore.get(GUEST_COOKIE)?.value;
    const responseBody = {
      authenticated: false,
      plan: 'guest' as const,
      chats: 0,
      analyses: 0,
      remainingAnalyses: GUEST_DAILY_LIMIT,
      dailyLimit: GUEST_DAILY_LIMIT,
    };

    if (!guestId) {
      guestId = generateGuestId();
      const res = NextResponse.json(responseBody);
      res.cookies.set(GUEST_COOKIE, guestId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
      return res;
    }

    const rl = await peek(`guest-usage:${guestId}`, GUEST_WINDOW_MS, GUEST_DAILY_LIMIT);
    const used = rl.count ?? GUEST_DAILY_LIMIT - rl.remaining;

    const res = NextResponse.json({
      ...responseBody,
      analyses: used,
      remainingAnalyses: rl.remaining,
    });

    if (!cookieStore.get(GUEST_COOKIE)?.value) {
      res.cookies.set(GUEST_COOKIE, guestId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return res;
  } catch (error) {
    console.error('Usage stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
