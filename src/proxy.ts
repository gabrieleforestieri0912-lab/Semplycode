import { NextRequest, NextResponse } from 'next/server';
import { updateSession, getAuthenticatedUser } from '@/lib/supabase/middleware';

const protectedPages = ['/chat', '/dashboard', '/settings', '/notes', '/extension-link'];
// Nota: le API del cassetto (/api/notes*, /api/categories, /api/learning-paths)
// e /api/chat/history gestiscono da sole l'auth (cookie O Bearer token
// dell'estensione), quindi NON vanno protette qui: il proxy legge solo i
// cookie e bloccherebbe le richieste Bearer dell'estensione.
const protectedApis = ['/api/checkout'];

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
  matcher: ['/chat/:path*', '/dashboard/:path*', '/settings/:path*', '/notes/:path*', '/extension-link/:path*', '/api/:path*'],
};
