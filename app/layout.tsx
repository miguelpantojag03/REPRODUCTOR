import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from './session-provider';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Reproductor de Música',
  description: 'Tu biblioteca musical personal.',
  icons: { icon: '/favicon.ico' },
  // PWA / iOS audio background support
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Música',
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A0A',
};

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Root layout: minimal — just HTML shell + SessionProvider
// The app shell (sidebar, player, etc.) lives in app/(app)/layout.tsx
// The login page has its own layout in app/login/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={cn(inter.variable, 'dark')}>
      <body className="bg-[#0a0a0a] text-gray-200 selection:bg-[#1db954]/30 font-sans antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
