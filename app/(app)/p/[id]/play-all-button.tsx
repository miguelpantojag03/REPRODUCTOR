'use client';

import { usePlayback } from '@/app/playback-context';
import { Song } from '@/lib/db/types';
import { Play, Shuffle } from 'lucide-react';

export function PlayAllButton({ songs }: { songs: Song[] }) {
  const { setPlaylist, playTrack } = usePlayback();

  const playAll = () => {
    if (!songs.length) return;
    setPlaylist(songs);
    playTrack(songs[0]);
  };

  const shuffleAll = () => {
    if (!songs.length) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    setPlaylist(shuffled);
    playTrack(shuffled[0]);
  };

  if (!songs.length) return null;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={playAll}
        className="flex items-center gap-2 bg-[#1db954] hover:bg-[#1ed760] active:scale-95 text-black font-bold px-7 py-3 rounded-full transition-all shadow-lg shadow-[#1db954]/20 hover:shadow-[#1db954]/30"
      >
        <Play className="size-5 fill-black" />
        Reproducir
      </button>
      <button
        onClick={shuffleAll}
        className="flex items-center justify-center size-12 rounded-full border border-white/20 text-white hover:border-white/40 hover:bg-white/5 active:scale-95 transition-all"
        title="Reproducir en aleatorio"
      >
        <Shuffle className="size-5" />
      </button>
    </div>
  );
}
