import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TrackTable } from './p/[id]/track-table';
import { Suspense } from 'react';
import { Loader2, Music, Clock, TrendingUp, ChevronRight, Sparkles, Plus } from 'lucide-react';
import { getAllPlaylists, getRecentlyPlayedSongs, getMostPlayedSongs, getRecentlyAddedSongs } from '@/lib/db/queries';
import { searchOnlineTracksAction, searchOnlineAlbumsAction } from './actions';
import { OnlineResults } from './online-results';
import { OnlineAlbums } from './online-albums';
import Link from 'next/link';
import { ScrollHeader } from './scroll-header';
import { getValidImageUrl } from '@/lib/utils';
import Image from 'next/image';
import { LibraryStats as LibraryStatsClient } from './library-stats';
import { RecentSongCard, MostPlayedRow } from './home-sections';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return 'Buenas noches 🌙';
  if (h < 12) return 'Buenos días ☀️';
  if (h < 18) return 'Buenas tardes 🎵';
  return 'Buenas noches 🌙';
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; liked?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || '';
  const liked = params.liked === 'true';

  const [playlists, onlineTracks, onlineAlbums, recentlyPlayed, mostPlayed, recentlyAdded] = await Promise.all([
    getAllPlaylists(),
    query ? searchOnlineTracksAction(query) : Promise.resolve([]),
    query ? searchOnlineAlbumsAction(query) : Promise.resolve([]),
    (!query && !liked) ? getRecentlyPlayedSongs(8) : Promise.resolve([]),
    (!query && !liked) ? getMostPlayedSongs(6) : Promise.resolve([]),
    (!query && !liked) ? getRecentlyAddedSongs(6) : Promise.resolve([]),
  ]);

  const topPlaylists = playlists.slice(0, 8);
  const isHome = !query && !liked;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#121212] rounded-none md:rounded-xl md:my-2 md:mr-2 relative">
      {/* Ambient gradient */}
      <div className="absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-indigo-950/50 via-[#121212]/80 to-transparent pointer-events-none" />

      <ScrollHeader query={query} />

      <ScrollArea className="flex-1 mt-14 sm:mt-16">
        <div className="relative z-10 pb-40 md:pb-10">

          {/* ── HOME ── */}
          {isHome && (
            <div className="px-4 sm:px-6 pt-6 space-y-8">

              {/* Greeting */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{getGreeting()}</h1>
                <p className="text-sm text-[#6b7280] mt-1">¿Qué quieres escuchar hoy?</p>
              </div>

              {/* Quick access playlists */}
              {topPlaylists.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-white">Acceso rápido</h2>
                    <Link href="#library" className="text-xs text-[#6b7280] hover:text-white transition-colors flex items-center gap-1">
                      Ver todo <ChevronRight className="size-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {topPlaylists.map(pl => (
                      <Link
                        key={pl.id}
                        href={`/p/${pl.id}`}
                        className="group flex items-center gap-3 bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.16] rounded-lg overflow-hidden transition-all duration-150 h-14"
                      >
                        <div className="w-14 h-14 flex-shrink-0 overflow-hidden">
                          {pl.coverUrl ? (
                            <Image src={pl.coverUrl} alt={pl.name} width={56} height={56} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500/40 to-purple-600/40 flex items-center justify-center">
                              <Music className="size-5 text-white/50" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-white truncate pr-3 flex-1">{pl.name}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Recently played */}
              {recentlyPlayed.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-[#1db954]" />
                      <h2 className="text-base font-bold text-white">Escuchado recientemente</h2>
                    </div>
                    <Link href="/history" className="text-xs text-[#6b7280] hover:text-white transition-colors flex items-center gap-1">
                      Ver historial <ChevronRight className="size-3" />
                    </Link>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                    {recentlyPlayed.map(song => <RecentSongCard key={song.id} song={song} />)}
                  </div>
                </section>
              )}

              {/* Recently added */}
              {recentlyAdded.length > 0 && recentlyPlayed.length === 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Plus className="size-4 text-blue-400" />
                    <h2 className="text-base font-bold text-white">Añadidos recientemente</h2>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                    {recentlyAdded.map(song => <RecentSongCard key={song.id} song={song} />)}
                  </div>
                </section>
              )}

              {/* Most played */}
              {mostPlayed.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="size-4 text-[#1db954]" />
                    <h2 className="text-base font-bold text-white">Más escuchadas</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {mostPlayed.map((song, i) => <MostPlayedRow key={song.id} song={song} rank={i + 1} />)}
                  </div>
                </section>
              )}

              {/* Library divider */}
              <div id="library" className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-[#6b7280] font-medium uppercase tracking-widest">Tu biblioteca</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <LibraryStatsClient />
            </div>
          )}

          {/* ── LIKED / SEARCH HEADER ── */}
          {(query || liked) && (
            <div className="px-4 sm:px-6 pt-6 pb-2">
              <h2 className="text-2xl font-black text-white">
                {liked ? '❤️ Tus me gusta' : `Resultados para "${query}"`}
              </h2>
            </div>
          )}

          {/* ── TRACK TABLE ── */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 text-[#1db954] animate-spin" />
            </div>
          }>
            <TrackTable query={query} liked={liked} />
          </Suspense>

          {/* ── ONLINE RESULTS ── */}
          {query && onlineAlbums.length > 0 && (
            <div className="px-4 sm:px-6">
              <OnlineAlbums albums={onlineAlbums} />
            </div>
          )}
          {query && onlineTracks.length > 0 && (
            <div className="px-4 sm:px-6">
              <OnlineResults tracks={onlineTracks} />
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
