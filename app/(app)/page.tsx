import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TrackTable } from '@/app/(app)/p/[id]/track-table';
import { Suspense } from 'react';
import { Loader2, Music, Clock, TrendingUp, ChevronRight, Plus, Heart, Disc3 } from 'lucide-react';
import {
  getAllPlaylists, getRecentlyPlayedSongs, getMostPlayedSongs,
  getRecentlyAddedSongs, getAllSongs,
} from '@/lib/db/queries';
import { searchOnlineTracksAction, searchOnlineAlbumsAction } from '@/app/actions';
import { OnlineResults } from '@/app/online-results';
import { OnlineAlbums } from '@/app/online-albums';
import Link from 'next/link';
import { ScrollHeader } from '@/app/scroll-header';
import { getValidImageUrl, formatDuration } from '@/lib/utils';
import Image from 'next/image';
import { LibraryStats as LibraryStatsClient } from '@/app/library-stats';
import { RecentSongCard, MostPlayedRow } from '@/app/home-sections';
import { OnboardingWrapper } from '@/app/onboarding-wrapper';
import { PersonalizedFeed } from '@/app/personalized-feed';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return { text: 'Buenas noches', emoji: '🌙' };
  if (h < 12) return { text: 'Buenos días',   emoji: '☀️' };
  if (h < 18) return { text: 'Buenas tardes', emoji: '🎵' };
  return       { text: 'Buenas noches',        emoji: '🌙' };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; liked?: string }>;
}) {
  const params = await searchParams;
  const query  = params.q || '';
  const liked  = params.liked === 'true';

  const [
    playlists, onlineTracks, onlineAlbums,
    recentlyPlayed, mostPlayed, recentlyAdded, allSongs,
  ] = await Promise.all([
    getAllPlaylists(),
    query ? searchOnlineTracksAction(query) : [],
    query ? searchOnlineAlbumsAction(query) : [],
    (!query && !liked) ? getRecentlyPlayedSongs(8)  : [],
    (!query && !liked) ? getMostPlayedSongs(6)       : [],
    (!query && !liked) ? getRecentlyAddedSongs(6)    : [],
    (!query && !liked) ? getAllSongs()               : [],
  ]);

  const topPlaylists = playlists.slice(0, 8);
  const isHome = !query && !liked;
  const greeting = getGreeting();

  // Stats for home
  const totalDuration = allSongs.reduce((a, s) => a + s.duration, 0);
  const uniqueArtists = new Set(allSongs.map(s => s.artist)).size;
  // Library artists for onboarding suggestions
  const libraryArtists = [...new Set(allSongs.map(s => s.artist))].slice(0, 20);

  return (
    <OnboardingWrapper libraryArtists={libraryArtists}>
    <div className="flex-1 flex flex-col overflow-hidden bg-[#121212] rounded-none md:rounded-xl md:my-2 md:mr-2 relative">
      {/* Ambient gradient — changes based on context */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-indigo-950/60 via-[#121212]/70 to-transparent pointer-events-none" />

      <ScrollHeader query={query} />

      <ScrollArea className="flex-1 mt-14 sm:mt-16">
        <div className="relative z-10">

          {/* ══════════════════════════════════════════
              HOME VIEW
          ══════════════════════════════════════════ */}
          {isHome && (
            <div className="px-4 sm:px-6 pt-8 pb-6 space-y-10">

              {/* Greeting + Stats */}
              <div className="animate-fade-up">
                <div className="flex items-end justify-between">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                      {greeting.text} {greeting.emoji}
                    </h1>
                    <p className="text-[#727272] text-sm mt-2">
                      {allSongs.length > 0
                        ? `${allSongs.length} canciones · ${uniqueArtists} artistas · ${Math.floor(totalDuration / 3600)}h de música`
                        : 'Tu biblioteca musical personal'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick access playlists */}
              {topPlaylists.length > 0 && (
                <section className="animate-fade-up stagger-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Acceso rápido</h2>
                    <Link
                      href="#library"
                      className="text-xs text-[#727272] hover:text-white transition-colors flex items-center gap-1 group"
                    >
                      Ver todo
                      <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {/* Liked songs card */}
                    <Link
                      href="/?liked=true"
                      className="group flex items-center gap-3 bg-gradient-to-br from-[#450af5]/80 to-[#8e8ee5]/60 hover:from-[#450af5] hover:to-[#8e8ee5]/80 rounded-lg overflow-hidden transition-all duration-200 h-14 shadow-lg"
                    >
                      <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
                        <Heart className="size-6 text-white fill-white" />
                      </div>
                      <span className="text-sm font-bold text-white truncate pr-3">Tus me gusta</span>
                    </Link>

                    {topPlaylists.map((pl, i) => (
                      <Link
                        key={pl.id}
                        href={`/p/${pl.id}`}
                        className="group flex items-center gap-3 bg-white/[0.07] hover:bg-white/[0.13] active:bg-white/[0.17] rounded-lg overflow-hidden transition-all duration-150 h-14"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <div className="w-14 h-14 flex-shrink-0 overflow-hidden">
                          {pl.coverUrl ? (
                            <Image src={pl.coverUrl} alt={pl.name} width={56} height={56} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500/50 to-purple-600/50 flex items-center justify-center">
                              <Music className="size-5 text-white/60" />
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
                <section className="animate-fade-up stagger-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-[#1db954]/15 flex items-center justify-center">
                        <Clock className="size-4 text-[#1db954]" />
                      </div>
                      <h2 className="text-lg font-bold text-white">Escuchado recientemente</h2>
                    </div>
                    <Link href="/history" className="text-xs text-[#727272] hover:text-white transition-colors flex items-center gap-1 group">
                      Ver historial <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                    {recentlyPlayed.map((song, i) => (
                      <div key={song.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                        <RecentSongCard song={song} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recently added (when no play history) */}
              {recentlyAdded.length > 0 && recentlyPlayed.length === 0 && (
                <section className="animate-fade-up stagger-2">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="size-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <Plus className="size-4 text-blue-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Añadidos recientemente</h2>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                    {recentlyAdded.map((song, i) => (
                      <div key={song.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                        <RecentSongCard song={song} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Most played */}
              {mostPlayed.length > 0 && (
                <section className="animate-fade-up stagger-3">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="size-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
                      <TrendingUp className="size-4 text-orange-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Más escuchadas</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {mostPlayed.map((song, i) => (
                      <div key={song.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <MostPlayedRow song={song} rank={i + 1} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Personalized feed based on favorite artists */}
              <PersonalizedFeed />

              {/* Library divider */}
              <div id="library" className="flex items-center gap-4 pt-2">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <div className="flex items-center gap-2">
                  <Disc3 className="size-3.5 text-[#727272]" />
                  <span className="text-[11px] text-[#727272] font-semibold uppercase tracking-[0.12em]">Tu biblioteca</span>
                </div>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <LibraryStatsClient />
            </div>
          )}

          {/* ══════════════════════════════════════════
              LIKED / SEARCH HEADER
          ══════════════════════════════════════════ */}
          {(query || liked) && (
            <div className="px-4 sm:px-6 pt-8 pb-4 animate-fade-up">
              {liked ? (
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-2xl bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center shadow-xl flex-shrink-0">
                    <Heart className="size-8 text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-xs text-[#727272] uppercase tracking-widest font-semibold mb-1">Lista automática</p>
                    <h2 className="text-3xl font-black text-white">Tus me gusta</h2>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-[#727272] uppercase tracking-widest font-semibold mb-1">Resultados de búsqueda</p>
                  <h2 className="text-2xl font-black text-white">"{query}"</h2>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════
              TRACK TABLE
          ══════════════════════════════════════════ */}
          <Suspense fallback={
            <div className="px-4 sm:px-6 pb-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-white/[0.04]" style={{ opacity: 1 - i * 0.1 }}>
                  <div className="w-8 h-4 bg-white/[0.05] rounded shimmer hidden sm:block" />
                  <div className="size-10 rounded-lg bg-white/[0.05] flex-shrink-0 shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-white/[0.05] rounded shimmer" style={{ width: `${55 + (i * 7) % 35}%` }} />
                    <div className="h-2.5 bg-white/[0.03] rounded shimmer" style={{ width: `${25 + (i * 5) % 20}%` }} />
                  </div>
                  <div className="hidden md:block h-3 w-20 bg-white/[0.03] rounded shimmer" />
                  <div className="h-3 w-10 bg-white/[0.03] rounded shimmer" />
                </div>
              ))}
            </div>
          }>
            <TrackTable query={query} liked={liked} />
          </Suspense>

          {/* ══════════════════════════════════════════
              ONLINE RESULTS
          ══════════════════════════════════════════ */}
          {query && onlineAlbums.length > 0 && (
            <div className="px-4 sm:px-6 animate-fade-up">
              <OnlineAlbums albums={onlineAlbums} />
            </div>
          )}
          {query && onlineTracks.length > 0 && (
            <div className="px-4 sm:px-6 animate-fade-up">
              <OnlineResults tracks={onlineTracks} />
            </div>
          )}

          {/* Bottom padding for player bar */}
          <div className="h-8 md:h-4" />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
    </OnboardingWrapper>
  );
}
