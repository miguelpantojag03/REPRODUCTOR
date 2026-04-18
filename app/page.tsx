import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TrackTable } from './p/[id]/track-table';
import { Suspense } from 'react';
import { Loader2, Music, Clock, TrendingUp } from 'lucide-react';
import { SearchInput } from './search';
import { getAllPlaylists, getRecentlyPlayedSongs, getMostPlayedSongs } from '@/lib/db/queries';
import { searchOnlineTracksAction, searchOnlineAlbumsAction } from './actions';
import { OnlineResults } from './online-results';
import { OnlineAlbums } from './online-albums';
import Link from 'next/link';
import { ScrollHeader } from './scroll-header';
import { getValidImageUrl, formatDuration } from '@/lib/utils';
import Image from 'next/image';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return '¡Buenos días!';
  if (hour < 18) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q: string; liked?: string }>;
}) {
  const params = await searchParams;
  const query = params.q;
  const liked = params.liked === 'true';
  const playlists = await getAllPlaylists();
  const topPlaylists = playlists.slice(0, 6);
  const onlineTracks = query ? await searchOnlineTracksAction(query) : [];
  const onlineAlbums = query ? await searchOnlineAlbumsAction(query) : [];
  const recentlyPlayed = !query && !liked ? await getRecentlyPlayedSongs(6) : [];
  const mostPlayed = !query && !liked ? await getMostPlayedSongs(5) : [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#121212] rounded-lg my-2 mr-2 relative">
      {/* Dynamic Background Gradient */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-indigo-900/40 to-[#121212] pointer-events-none" />

      {/* Sticky Header */}
      <ScrollHeader query={query} />

      <ScrollArea className="flex-1 mt-16 text-white pb-[69px]">
        <div className="px-6 py-6 min-w-max relative z-10">

          {/* Hero Section — Quick Access Playlists */}
          {!query && !liked && (
            <section className="mb-8">
              <h1 className="text-[32px] font-bold mb-6 tracking-tight text-white mt-4">{getGreeting()}</h1>
              {topPlaylists.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {topPlaylists.map((playlist) => (
                    <Link
                      href={`/p/${playlist.id}`}
                      key={playlist.id}
                      className="group relative flex items-center gap-4 bg-white/[0.05] hover:bg-white/20 transition-colors rounded overflow-hidden cursor-pointer h-16"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/40 to-purple-500/40 flex-shrink-0 flex items-center justify-center shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                        {playlist.coverUrl ? (
                          <Image src={playlist.coverUrl} alt={playlist.name} width={64} height={64} className="object-cover w-full h-full" />
                        ) : (
                          <Music className="text-white/60 size-6" />
                        )}
                      </div>
                      <span className="font-bold text-[15px] drop-shadow-md pr-16 truncate">{playlist.name}</span>
                      <button className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all bg-[#1db954] text-black rounded-full p-3 shadow-xl transform translate-y-2 group-hover:translate-y-0 hover:scale-105 hover:bg-[#1fdf64] duration-200">
                        <svg className="size-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Recently Played */}
          {recentlyPlayed.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="size-5 text-[#1db954]" />
                <h2 className="text-xl font-bold">Escuchado recientemente</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {recentlyPlayed.map((song) => (
                  <RecentSongCard key={song.id} song={song} />
                ))}
              </div>
            </section>
          )}

          {/* Most Played */}
          {mostPlayed.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="size-5 text-[#1db954]" />
                <h2 className="text-xl font-bold">Más escuchadas</h2>
              </div>
              <div className="space-y-1">
                {mostPlayed.map((song, i) => (
                  <MostPlayedRow key={song.id} song={song} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          {/* Main Track Table */}
          <section>
            {(query || liked) && (
              <h2 className="text-2xl font-bold mb-4">{liked ? 'Tus me gusta' : 'En tu biblioteca'}</h2>
            )}
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center p-20">
                  <Loader2 className="animate-spin text-gray-500" />
                </div>
              }
            >
              <TrackTable query={query} liked={liked} />
            </Suspense>
          </section>

          {query && onlineAlbums.length > 0 && <OnlineAlbums albums={onlineAlbums} />}
          {query && onlineTracks.length > 0 && <OnlineResults tracks={onlineTracks} />}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function RecentSongCard({ song }: { song: any }) {
  return (
    <div className="flex-shrink-0 w-36 group cursor-pointer">
      <div className="relative w-36 h-36 rounded-lg overflow-hidden bg-[#282828] mb-2 shadow-lg">
        <Image
          src={getValidImageUrl(song.imageUrl)}
          alt={song.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-[#1db954] rounded-full p-3 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <svg className="size-5 ml-0.5 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <p className="text-sm font-medium text-white truncate">{song.name}</p>
      <p className="text-xs text-gray-400 truncate">{song.artist}</p>
    </div>
  );
}

function MostPlayedRow({ song, rank }: { song: any; rank: number }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 transition-colors group cursor-pointer">
      <span className="text-gray-500 tabular-nums w-5 text-center text-sm font-bold">{rank}</span>
      <div className="relative size-10 rounded overflow-hidden bg-[#282828] flex-shrink-0">
        <Image src={getValidImageUrl(song.imageUrl)} alt={song.name} fill className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{song.name}</p>
        <p className="text-xs text-gray-400 truncate">{song.artist}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
        <TrendingUp className="size-3" />
        <span className="tabular-nums">{song.playCount}</span>
      </div>
      <span className="text-xs tabular-nums text-gray-500 flex-shrink-0">{formatDuration(song.duration)}</span>
    </div>
  );
}
