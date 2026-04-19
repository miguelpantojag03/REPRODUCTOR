'use client';

import { usePlayback } from '@/app/playback-context';
import { Song } from '@/lib/db/types';

export function ArtistClient({
  songs,
  songId,
  mode,
  children,
}: {
  songs: Song[];
  songId?: string;
  mode?: 'play-all';
  children: React.ReactNode;
}) {
  const { playTrack, setPlaylist } = usePlayback();

  const handleClick = () => {
    setPlaylist(songs);
    if (mode === 'play-all') {
      playTrack(songs[0]);
    } else if (songId) {
      const song = songs.find(s => s.id === songId);
      if (song) playTrack(song);
    }
  };

  return <div onClick={handleClick}>{children}</div>;
}
