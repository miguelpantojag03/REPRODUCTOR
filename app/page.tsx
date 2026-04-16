import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TrackTable } from './p/[id]/track-table';
import { Suspense } from 'react';
import { Loader2, UserRound, Music } from 'lucide-react';
import { SearchInput } from './search';
import { getAllPlaylists } from '@/lib/db/queries';
import { searchOnlineTracksAction } from './actions';
import { OnlineResults } from './online-results';
import Link from 'next/link';
import { ScrollHeader } from './scroll-header';

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#121212] rounded-lg my-2 mr-2 relative">
      {/* Dynamic Background Gradient */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-indigo-900/40 to-[#121212] pointer-events-none" />
      
      {/* Sticky Header */}
      <ScrollHeader query={query} />

      <ScrollArea className="flex-1 mt-16 text-white pb-[69px]">
        <div className="px-6 py-6 min-w-max relative z-10">
          
          {/* Hero Section */}
          {!query && (
            <section className="mb-8">
              <h1 className="text-[32px] font-bold mb-6 tracking-tight text-white mt-4">¡Buenos días!</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topPlaylists.map((playlist) => (
                  <Link href={`/p/${playlist.id}`} key={playlist.id} className="group relative flex items-center gap-4 bg-white/[0.05] hover:bg-white/20 transition-colors rounded overflow-hidden cursor-pointer h-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/40 to-purple-500/40 flex-shrink-0 flex items-center justify-center shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                      <Music className="text-white/60 size-6" />
                    </div>
                    <span className="font-bold text-[15px] drop-shadow-md pr-16 truncate">{playlist.name}</span>
                    <button className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all bg-[#1db954] text-black rounded-full p-3 shadow-xl transform translate-y-2 group-hover:translate-y-0 hover:scale-105 hover:bg-[#1fdf64] duration-200">
                      <svg className="size-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </button>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            {(query || liked) && <h2 className="text-2xl font-bold mb-4">{liked ? "Tus me gusta" : "En tu biblioteca"}</h2>}
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center p-20"><Loader2 className="animate-spin text-gray-500" /></div>}>
              <TrackTable query={query} liked={liked} />
            </Suspense>
          </section>

          {query && onlineTracks.length > 0 && (
            <OnlineResults tracks={onlineTracks} />
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
