'use client';

import { usePlayback } from '@/app/playback-context';
import { Song } from '@/lib/db/types';

export function HistoryClient({ song, children }: { song: Song; children: React.ReactNode }) {
  const { playTrack } = usePlayback();
  return (
    <div onClick={() => playTrack(song)}>
      {children}
    </div>
  );
}
