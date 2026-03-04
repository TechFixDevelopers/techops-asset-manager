import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/middleware/rate-limit';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  // Rate limit login attempts (10 per 15 min per IP)
  if (pathname.startsWith('/api/auth/callback/credentials') && req.method === 'POST') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos de login. Intente en 15 minutos.' },
        { status: 429 },
      );
    }
  }

  // Public routes
  const publicRoutes = ['/login', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    if (isLoggedIn && pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Protected routes require auth
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (isAdminRoute && req.auth?.user?.perfil !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)'],
};
