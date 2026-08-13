import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { peekTokens } from '@/lib/rateLimiter';
import { GUEST_COOKIE, generateGuestId } from '@/lib/guestSession';
import { getAuthUser } from '@/lib/api-auth';
import { findUserByEmail, updateUser, countChatsByUserId } from '@/lib/supabase/db';
import {
  GUEST_DAILY_TOKEN_BUDGET,
  getPlanTokenBudget,
  isNewMonth,
} from '@/lib/tokenBudget';

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

      const plan = user.plan || 'free';
      const budget = getPlanTokenBudget(plan);

      // Reset mensile
      let tokensUsed = user.tokens_used_month || 0;
      if (isNewMonth(user.tokens_period_start)) {
        tokensUsed = 0;
        await updateUser(email, {
          tokens_used_month: 0,
          tokens_period_start: new Date().toISOString(),
        }).catch(() => {});
      }

      const chats = await countChatsByUserId(user.email);
      const remainingTokens = budget === null ? null : Math.max(0, budget - tokensUsed);

      return NextResponse.json({
        authenticated: true,
        plan,
        chats,
        tokensUsed,
        tokenLimit: budget,
        remainingTokens,
        periodStart: user.tokens_period_start || new Date().toISOString(),
      });
    }

    const cookieStore = await cookies();
    let guestId = cookieStore.get(GUEST_COOKIE)?.value;
    const responseBody = {
      authenticated: false,
      plan: 'guest' as const,
      chats: 0,
      tokensUsed: 0,
      tokenLimit: GUEST_DAILY_TOKEN_BUDGET,
      remainingTokens: GUEST_DAILY_TOKEN_BUDGET,
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

    const rl = await peekTokens(`guest-tokens:${guestId}`, GUEST_WINDOW_MS, GUEST_DAILY_TOKEN_BUDGET);
    const used = rl.count ?? 0;

    const res = NextResponse.json({
      ...responseBody,
      tokensUsed: used,
      remainingTokens: rl.remaining,
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
