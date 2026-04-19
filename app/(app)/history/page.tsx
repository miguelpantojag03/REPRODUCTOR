import { db } from '@/lib/db/drizzle';
import { songs } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getValidImageUrl, formatDuration } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Clock, TrendingUp, BarChart2 } from 'lucide-react';
import { HistoryClient } from './history-client';

async function getHistory() {
  return db
    .select()
    .from(songs)
    .where(sql`${songs.lastPlayedAt} IS NOT NULL`)
    .orderBy(desc(songs.lastPlayedAt))
    .limit(50);
}

async function getTopSongs() {
  return db
    .select()
    .from(songs)
    .where(sql`${songs.playCount} > 0`)
    .orderBy(desc(songs.playCount))
    .limit(20);
}

function timeAgo(date: Date | null) {
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default async function HistoryPage() {
  const [history, topSongs] = await Promise.all([getHistory(), getTopSongs()]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#121212] rounded-lg my-2 mr-2 relative">
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-purple-900/30 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-6 pt-6 pb-4">
        <Link href="/" className="text-[#b3b3b3] hover:text-white transition-colors">
          <ChevronLeft className="size-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Historial</h1>
          <p className="text-sm text-gray-400 mt-0.5">{history.length} canciones reproducidas</p>
        </div>
      </div>

      <ScrollArea className="flex-1 pb-24">
        <div className="px-6 pb-8">
          {/* Top Played */}
          {topSongs.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="size-5 text-[#1db954]" />
                <h2 className="text-xl font-bold">Más reproducidas</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topSongs.slice(0, 10).map((song, i) => (
                  <HistoryClient key={song.id} song={song}>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                      <span className="text-2xl font-black text-gray-700 w-8 text-center tabular-nums">{i + 1}</span>
                      <div className="relative size-12 rounded overflow-hidden flex-shrink-0">
                        <Image src={getValidImageUrl(song.imageUrl)} alt={song.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{song.name}</p>
                        <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#1db954] font-bold flex-shrink-0">
                        <BarChart2 className="size-3" />
                        {song.playCount}
                      </div>
                    </div>
                  </HistoryClient>
                ))}
              </div>
            </section>
          )}

          {/* Recent History */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="size-5 text-blue-400" />
              <h2 className="text-xl font-bold">Reproducido recientemente</h2>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <Clock className="size-12 mx-auto mb-3 opacity-30" />
                <p>Aún no has reproducido ninguna canción</p>
              </div>
            ) : (
              <div className="space-y-1">
                {history.map((song) => (
                  <HistoryClient key={`h-${song.id}`} song={song}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className="relative size-11 rounded overflow-hidden flex-shrink-0">
                        <Image src={getValidImageUrl(song.imageUrl)} alt={song.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{song.name}</p>
                        <p className="text-xs text-gray-400 truncate">{song.artist} • {song.album}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">{timeAgo(song.lastPlayedAt)}</p>
                        <p className="text-xs text-gray-600">{formatDuration(song.duration)}</p>
                      </div>
                    </div>
                  </HistoryClient>
                ))}
              </div>
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
