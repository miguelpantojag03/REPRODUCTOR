import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// These paths are always public — no auth needed
const PUBLIC_PATHS = new Set([
  '/login',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/sw.js',
  '/placeholder.svg',
]);

const PUBLIC_PREFIXES = [
  '/api/auth',   // NextAuth endpoints
  '/api/audio',  // Audio streaming
  '/api/songs',  // Songs API
  '/_next',      // Next.js internals
  '/icon-',      // PWA icons
  '/audio/',     // Local audio files
  '/album_covers/', // Album art
];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  // Always allow public prefixes
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Allow static file extensions
  if (/\.(ico|png|svg|jpg|jpeg|gif|webp|mp3|css|js|woff|woff2|map)$/.test(pathname)) {
    return NextResponse.next();
  }

  // Check JWT token
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    // Support both cookie names (dev vs prod)
    cookieName: process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
  });

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/' && pathname !== '/login') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match everything except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
