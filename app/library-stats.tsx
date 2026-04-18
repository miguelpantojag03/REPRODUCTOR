'use client';

import { usePlayback } from './playback-context';
import { formatDuration, cn } from '@/lib/utils';
import { Music2, Clock, Users, Disc3, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

export function LibraryStats() {
  const { playlist } = usePlayback();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (playlist.length > 0) setVisible(true);
  }, [playlist.length]);

  if (!visible || playlist.length === 0) return null;

  const totalDuration = playlist.reduce((acc, s) => acc + s.duration, 0);
  const uniqueArtists = new Set(playlist.map((s) => s.artist)).size;
  const uniqueAlbums = new Set(playlist.map((s) => s.album).filter(Boolean)).size;
  const favorites = playlist.filter((s) => (s as any).favorite).length;

  const stats = [
    { icon: Music2, label: 'Canciones', value: playlist.length, color: 'text-[#1db954]' },
    { icon: Clock, label: 'Duración', value: formatDuration(totalDuration), color: 'text-blue-400' },
    { icon: Users, label: 'Artistas', value: uniqueArtists, color: 'text-purple-400' },
    { icon: Disc3, label: 'Álbumes', value: uniqueAlbums, color: 'text-orange-400' },
    { icon: Heart, label: 'Favoritas', value: favorites, color: 'text-pink-400' },
  ];

  return (
    <div className="flex items-center gap-4 flex-wrap mb-6">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5">
          <Icon className={cn('size-3.5', color)} />
          <span className="text-xs text-gray-400">{label}:</span>
          <span className="text-xs font-bold text-white tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}
