import { Suspense } from 'react';
import { NowPlaying } from '@/app/now-playing';
import { PlaybackProvider } from '@/app/playback-context';
import { getAllPlaylists } from '@/lib/db/queries';
import { OptimisticPlaylists } from '@/app/optimistic-playlists';
import { PlaylistProvider } from '@/app/hooks/use-playlist';
import { MobileNav } from '@/app/mobile-nav';
import { PlaybackControls } from '@/app/playback-controls';
import { ToastProvider } from '@/app/toast-provider';
import { MiniPlayer } from '@/app/mini-player';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const playlistsPromise = getAllPlaylists();

  return (
    <PlaybackProvider>
      <ToastProvider>
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
            <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden">
              <OptimisticPlaylists />
              <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                {children}
                <NowPlaying />
              </div>
              <PlaybackControls />
              <MiniPlayer />
              <MobileNav />
            </div>
          </PlaylistProvider>
        </Suspense>
      </ToastProvider>
    </PlaybackProvider>
  );
}
