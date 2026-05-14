import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedPages = ['/chat', '/dashboard', '/settings'];
const protectedApis = ['/api/chat', '/api/chat/history', '/api/checkout'];

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isProtectedPage = protectedPages.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isProtectedApi = protectedApis.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (!token && isProtectedApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!token && isProtectedPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname.startsWith('/api')) {
    const response = NextResponse.next();
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    
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
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/chat/:path*', '/dashboard/:path*', '/settings/:path*', '/api/:path*'],
};
