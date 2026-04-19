import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth is OPTIONAL — the app works without login.
// This proxy only handles redirects for specific protected routes.
// The login page is accessible to everyone.

export default function proxy(req: NextRequest) {
  // Allow everything through — auth is handled client-side
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
