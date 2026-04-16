'use client';

import { getValidImageUrl } from '@/lib/utils';
import { Music, Disc } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Album {
  id: string;
  name: string;
  artist: string;
  imageUrl: string;
  genre: string;
  trackCount: number;
  year: number;
}

export function OnlineAlbums({ albums }: { albums: Album[] }) {
  if (!albums || albums.length === 0) return null;

  return (
    <section className="mt-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 mb-6">
        <Disc className="size-5 text-purple-400" />
        <h2 className="text-2xl font-bold">Álbumes Reales</h2>
      </div>

      <div className="flex flex-wrap gap-6">
        {albums.map((album, index) => (
          <Link
            key={album.id}
            href={`/?q=${encodeURIComponent(album.name + ' ' + album.artist)}`}
            className="group w-44 bg-[#181818] hover:bg-[#282828] p-4 rounded-md transition-all duration-300 shadow-lg cursor-pointer animate-in fade-in zoom-in-95"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative aspect-square w-full mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
              <img
                src={getValidImageUrl(album.imageUrl)}
                alt={album.name}
                className="object-cover w-full h-full rounded shadow-md group-hover:scale-105 transition-transform duration-500"
              />
              <button className="absolute right-2 bottom-2 size-10 bg-[#1db954] text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110">
                <Music className="size-5 fill-black" />
              </button>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm truncate text-white">{album.name}</h3>
              <p className="text-xs text-[#b3b3b3] truncate">{album.artist} • {album.year}</p>
              <p className="text-[10px] text-[#b3b3b3] uppercase tracking-wider">{album.trackCount} canciones</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
