'use client';

import { usePlayback } from '@/app/playback-context';
import { Song } from '@/lib/db/types';
import { Play, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PlayAllButton({ songs }: { songs: Song[] }) {
  const { setPlaylist, playTrack, toggleShuffle, isShuffle } = usePlayback();

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    setPlaylist(songs);
    playTrack(songs[0]);
  };

  const handleShuffleAll = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    setPlaylist(shuffled);
    playTrack(shuffled[0]);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handlePlayAll}
        disabled={songs.length === 0}
        className="h-8 text-xs bg-[#1db954] hover:bg-[#1fdf64] text-black font-bold px-5 rounded-full transition-all hover:scale-105 active:scale-95"
      >
        <Play className="size-3.5 mr-1.5 fill-black" />
        Reproducir todo
      </Button>
      <Button
        onClick={handleShuffleAll}
        disabled={songs.length === 0}
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-[#b3b3b3] hover:text-white hover:bg-white/10 rounded-full"
        title="Reproducir en aleatorio"
      >
        <Shuffle className="size-4" />
      </Button>
    </div>
  );
}
