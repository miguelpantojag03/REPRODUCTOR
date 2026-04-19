import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PREFIXES = [
  '/login',
  '/api/auth',
  '/api/audio',
  '/api/songs',
  '/_next',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/sw.js',
  '/icon-',
  '/placeholder',
];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PREFIXES.some(p => pathname.startsWith(p)) ||
    /\.(ico|png|svg|jpg|jpeg|gif|webp|mp3|css|js|woff|woff2)$/.test(pathname);

  if (isPublic) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
