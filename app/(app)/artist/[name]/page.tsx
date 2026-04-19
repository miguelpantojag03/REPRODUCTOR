import { db } from '@/lib/db/drizzle';
import { songs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getValidImageUrl, formatDuration } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Music2, Play } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ArtistClient } from './artist-client';

async function getArtistSongs(name: string) {
  return db
    .select()
    .from(songs)
    .where(eq(songs.artist, decodeURIComponent(name)))
    .orderBy(desc(songs.playCount));
}

export default async function ArtistPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const artistSongs = await getArtistSongs(name);
  const artistName = decodeURIComponent(name);

  if (artistSongs.length === 0) notFound();

  const totalPlays = artistSongs.reduce((a, s) => a + s.playCount, 0);
  const totalDuration = artistSongs.reduce((a, s) => a + s.duration, 0);
  const albums = [...new Set(artistSongs.map(s => s.album).filter(Boolean))];
  const coverImage = artistSongs.find(s => s.imageUrl)?.imageUrl;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#121212] rounded-lg my-2 mr-2 relative">
      {/* Hero background */}
      <div className="absolute top-0 inset-x-0 h-80 pointer-events-none overflow-hidden">
        {coverImage && (
          <div
            className="absolute inset-0 opacity-20 blur-3xl scale-110"
            style={{ backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#121212]/60 to-[#121212]" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-6">
        <Link href="/" className="inline-flex items-center gap-1 text-[#b3b3b3] hover:text-white transition-colors mb-6">
          <ChevronLeft className="size-5" />
          <span className="text-sm">Volver</span>
        </Link>

        <div className="flex items-end gap-6 mb-6">
          <div className="size-40 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center shadow-2xl flex-shrink-0 border-4 border-white/10">
            {coverImage ? (
              <Image src={getValidImageUrl(coverImage)} alt={artistName} width={160} height={160} className="object-cover w-full h-full" />
            ) : (
              <Music2 className="size-16 text-white/30" />
            )}
          </div>
          <div>
            <p className="text-xs text-white/60 uppercase tracking-widest font-bold mb-1">Artista</p>
            <h1 className="text-5xl font-black text-white mb-3">{artistName}</h1>
            <p className="text-sm text-gray-400">
              {artistSongs.length} canciones • {albums.length} álbumes • {totalPlays} reproducciones
            </p>
            <div className="mt-4">
              <ArtistClient songs={artistSongs} mode="play-all">
                <button className="flex items-center gap-2 bg-[#1db954] hover:bg-[#1fdf64] text-black font-bold px-6 py-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg">
                  <Play className="size-5 fill-black" />
                  Reproducir
                </button>
              </ArtistClient>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 pb-24">
        <div className="px-6">
          {/* Popular tracks */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">Popular</h2>
            <div className="space-y-1">
              {artistSongs.slice(0, 5).map((song, i) => (
                <ArtistClient key={song.id} songs={artistSongs} songId={song.id}>
                  <div className="flex items-center gap-4 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                    <span className="text-gray-500 w-5 text-center text-sm group-hover:hidden">{i + 1}</span>
                    <Play className="size-4 text-white fill-white hidden group-hover:block flex-shrink-0" />
                    <div className="relative size-12 rounded overflow-hidden flex-shrink-0">
                      <Image src={getValidImageUrl(song.imageUrl)} alt={song.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{song.name}</p>
                      <p className="text-xs text-gray-400">{song.album}</p>
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums">{formatDuration(song.duration)}</span>
                  </div>
                </ArtistClient>
              ))}
            </div>
          </section>

          {/* Albums */}
          {albums.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">Álbumes</h2>
              <div className="flex flex-wrap gap-4">
                {albums.map(album => {
                  const albumSongs = artistSongs.filter(s => s.album === album);
                  const cover = albumSongs.find(s => s.imageUrl)?.imageUrl;
                  return (
                    <div key={album} className="w-40 group cursor-pointer">
                      <div className="relative w-40 h-40 rounded-lg overflow-hidden bg-[#282828] mb-2 shadow-lg">
                        {cover ? (
                          <Image src={getValidImageUrl(cover)} alt={album!} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music2 className="size-10 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-white truncate">{album}</p>
                      <p className="text-xs text-gray-400">{albumSongs.length} canciones</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* All songs */}
          <section>
            <h2 className="text-xl font-bold mb-4">Todas las canciones</h2>
            <div className="space-y-1">
              {artistSongs.map((song, i) => (
                <ArtistClient key={`all-${song.id}`} songs={artistSongs} songId={song.id}>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                    <span className="text-gray-600 w-5 text-center text-xs group-hover:hidden">{i + 1}</span>
                    <Play className="size-3.5 text-white fill-white hidden group-hover:block flex-shrink-0" />
                    <div className="relative size-10 rounded overflow-hidden flex-shrink-0">
                      <Image src={getValidImageUrl(song.imageUrl)} alt={song.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{song.name}</p>
                      <p className="text-xs text-gray-500 truncate">{song.album}</p>
                    </div>
                    <span className="text-xs text-gray-600 tabular-nums">{formatDuration(song.duration)}</span>
                  </div>
                </ArtistClient>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
