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
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Next.js Music Player',
  description: 'A music player built with Next.js.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A0A',
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const playlistsPromise = getAllPlaylists();

  return (
    <html lang="en" className={cn(inter.className, "dark")}>
      <body className="flex flex-col md:flex-row h-[100dvh] text-gray-200 bg-black overflow-hidden selection:bg-[#1db954]/30">
        <PlaybackProvider>
          <ToastProvider>
            <Suspense fallback={<div className="h-[100dvh] w-full bg-black animate-pulse" />}>
              <PlaylistProvider playlistsPromise={playlistsPromise}>
                <OptimisticPlaylists />
                {children}
                <NowPlaying />
                <PlaybackControls />
                <MobileNav />
              </PlaylistProvider>
            </Suspense>
          </ToastProvider>
        </PlaybackProvider>
      </body>
    </html>
  );
}
