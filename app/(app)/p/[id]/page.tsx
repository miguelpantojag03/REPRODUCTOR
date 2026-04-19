import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChevronLeft } from 'lucide-react';
import { TrackTable } from './track-table';
import { getPlaylistWithSongs } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDuration } from '@/lib/utils';
import { CoverImage } from './cover-image';
import { EditableTitle } from './editable-title';
import { PlayAllButton } from './play-all-button';

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let id = (await params).id;
  let playlist = await getPlaylistWithSongs(id);

  if (!playlist) {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0A] pb-[69px] relative">
      {/* Gradient header */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-900/30 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between p-3 relative z-10">
        <div className="flex items-center space-x-1">
          <Link href="/" passHref>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/30 hover:bg-black/50">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-end py-4 px-4 sm:px-6 gap-4 sm:gap-5 relative z-10 flex-wrap sm:flex-nowrap">
        <CoverImage url={playlist.coverUrl} playlistId={playlist.id} />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white/60 uppercase tracking-widest font-bold mb-1">Lista de reproducción</p>
          <EditableTitle playlistId={playlist.id} initialName={playlist.name} />
          <p className="text-sm text-gray-400 mt-1.5">
            {playlist.trackCount} canciones • {formatDuration(playlist.duration)}
          </p>
          <div className="mt-3">
            <PlayAllButton songs={playlist.songs} />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 mt-2 relative z-10">
        <TrackTable playlist={playlist} />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
