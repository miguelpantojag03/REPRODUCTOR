import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TrackTable } from './p/[id]/track-table';
import { getAllSongs, searchSongs } from '@/lib/db/queries';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const query = (await searchParams).q;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0A] pb-[69px] pt-2">
      <ScrollArea className="flex-1">
        <div className="min-w-max">
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center p-20"><Loader2 className="animate-spin text-gray-500" /></div>}>
            <TrackTable query={query} />
          </Suspense>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
