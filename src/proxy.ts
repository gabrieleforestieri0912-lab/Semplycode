import { NextRequest, NextResponse } from 'next/server';
import { updateSession, getAuthenticatedUser } from '@/lib/supabase/middleware';

const protectedPages = ['/dashboard', '/settings'];
const protectedApis = ['/api/chat/history', '/api/checkout'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionResponse = await updateSession(request);
  const user = await getAuthenticatedUser(request);

  const isProtectedPage = protectedPages.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isProtectedApi = protectedApis.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (!user && isProtectedApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!user && isProtectedPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname.startsWith('/api')) {
    sessionResponse.headers.set('Access-Control-Allow-Origin', '*');
    sessionResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    sessionResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    sessionResponse.headers.set('Access-Control-Max-Age', '86400');

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    return sessionResponse;
  }

  return sessionResponse;
}

export const config = {
  matcher: ['/chat/:path*', '/dashboard/:path*', '/settings/:path*', '/api/:path*'],
};
