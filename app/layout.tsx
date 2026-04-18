import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import { NowPlaying } from './now-playing';
import { PlaybackProvider } from './playback-context';
import { getAllPlaylists } from '@/lib/db/queries';
import { OptimisticPlaylists } from './optimistic-playlists';
import { PlaylistProvider } from './hooks/use-playlist';
import { MobileNav } from './mobile-nav';
import { PlaybackControls } from './playback-controls';
import { ToastProvider } from './toast-provider';
import { MiniPlayer } from './mini-player';
import { SessionProvider } from './session-provider';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Reproductor de Música',
  description: 'Tu biblioteca musical personal.',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A0A',
};

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const playlistsPromise = getAllPlaylists();

  return (
    <html lang="es" className={cn(inter.variable, 'dark')}>
      <body className="flex flex-col md:flex-row h-[100dvh] text-gray-200 bg-[#0a0a0a] overflow-hidden selection:bg-[#1db954]/30 font-sans antialiased">
        <PlaybackProvider>
          <ToastProvider>
            <SessionProvider>
            <Suspense fallback={
              <div className="h-[100dvh] w-full bg-[#0a0a0a] flex items-center justify-center">
                <div className="flex items-end gap-1 h-8">
                  <div className="w-1 bg-[#1db954] rounded-full wave-bar-1" />
                  <div className="w-1 bg-[#1db954] rounded-full wave-bar-2" />
                  <div className="w-1 bg-[#1db954] rounded-full wave-bar-3" />
                  <div className="w-1 bg-[#1db954] rounded-full wave-bar-4" />
                  <div className="w-1 bg-[#1db954] rounded-full wave-bar-5" />
                </div>
              </div>
            }>
              <PlaylistProvider playlistsPromise={playlistsPromise}>
                <OptimisticPlaylists />
                <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                  {children}
                  <NowPlaying />
                </div>
                <PlaybackControls />
                <MiniPlayer />
                <MobileNav />
              </PlaylistProvider>
            </Suspense>
          </SessionProvider>
          </ToastProvider>
        </PlaybackProvider>
      </body>
    </html>
  );
}
