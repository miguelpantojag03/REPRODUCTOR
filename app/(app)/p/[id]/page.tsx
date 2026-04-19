import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChevronLeft, Play, Shuffle, Clock, Music2 } from 'lucide-react';
import { TrackTable } from './track-table';
import { getPlaylistWithSongs } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDuration, getValidImageUrl } from '@/lib/utils';
import { CoverImage } from './cover-image';
import { EditableTitle } from './editable-title';
import { PlayAllButton } from './play-all-button';

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const playlist = await getPlaylistWithSongs(id);
  if (!playlist) notFound();

  // Pick a dominant color from the cover for the gradient
  const hasCover = Boolean(playlist.coverUrl);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a] relative">
      {/* Hero gradient */}
      <div className="absolute top-0 inset-x-0 h-72 pointer-events-none overflow-hidden">
        {hasCover && (
          <div
            className="absolute inset-0 opacity-30 blur-3xl scale-110"
            style={{
              backgroundImage: `url(${getValidImageUrl(playlist.coverUrl)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        <div className={`absolute inset-0 bg-gradient-to-b ${hasCover ? 'from-black/20' : 'from-indigo-950/40'} via-[#0a0a0a]/60 to-[#0a0a0a]`} />
      </div>

      {/* Back button */}
      <div className="relative z-10 px-4 sm:px-6 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[#b3b3b3] hover:text-white transition-colors text-sm group"
        >
          <ChevronLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver
        </Link>
      </div>

      {/* Playlist header */}
      <div className="relative z-10 px-4 sm:px-6 pt-4 pb-6">
        <div className="flex items-end gap-5 flex-wrap sm:flex-nowrap">
          {/* Cover */}
          <div className="flex-shrink-0">
            <CoverImage url={playlist.coverUrl} playlistId={playlist.id} />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1 pb-1">
            <p className="text-xs text-white/60 uppercase tracking-widest font-bold mb-2">Lista de reproducción</p>
            <EditableTitle playlistId={playlist.id} initialName={playlist.name} />

            <div className="flex items-center gap-2 mt-2 text-sm text-[#b3b3b3]">
              <Music2 className="size-3.5" />
              <span>{playlist.trackCount} canciones</span>
              <span className="text-white/20">·</span>
              <Clock className="size-3.5" />
              <span>{formatDuration(playlist.duration)}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-5">
              <PlayAllButton songs={playlist.songs} />
            </div>
          </div>
        </div>
      </div>

      {/* Track list */}
      <ScrollArea className="flex-1 relative z-10">
        <TrackTable playlist={playlist} />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
