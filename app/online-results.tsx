'use client';

import { Song } from '@/lib/db/types';
import { formatDuration, getValidImageUrl } from '@/lib/utils';
import { usePlayback } from '@/app/playback-context';
import { Button } from '@/components/ui/button';
import { Play, Pause, Heart, Globe, Plus, Loader2 } from 'lucide-react';
import { saveOnlineTrackAction } from './actions';
import { useState } from 'react';
import { cn } from '@/lib/utils';

import { useToast } from './toast-provider';

export function OnlineResults({ tracks }: { tracks: any[] }) {
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayback();
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSaveTrack = async (track: any) => {
    setSavingId(track.id);
    try {
      const result = await saveOnlineTrackAction(track);
      if (result.success) {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        if (!favorites.includes(track.id)) {
          localStorage.setItem('favorites', JSON.stringify([...favorites, track.id]));
        }
        window.dispatchEvent(new CustomEvent('refresh-songs'));
        toast(`"${track.name}" guardada en tu biblioteca`, 'success');
      }
    } catch (err) {
      console.error(err);
      toast('Error al guardar la canción', 'error');
    } finally {
      setSavingId(null);
    }
  };

  if (!tracks || tracks.length === 0) return null;

  return (
    <section className="mt-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="size-5 text-indigo-400" />
        <h2 className="text-2xl font-bold">Resultados Globales (En línea)</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-[2px]">
        <div className="flex items-center text-gray-400 text-[10px] uppercase tracking-widest px-4 py-2 border-b border-white/5 bg-[#121212]/50">
          <span className="w-10 text-center">#</span>
          <span className="flex-1 ml-4">Título</span>
          <span className="w-32 hidden md:block">Álbum</span>
          <span className="w-20 text-right pr-12">Duración</span>
        </div>
        
        {tracks.map((track, index) => {
          const isCurrent = currentTrack?.id === track.id;
          return (
            <div 
              key={track.id}
              className={cn(
                "group flex items-center px-4 py-2 rounded-md hover:bg-white/10 transition-all cursor-pointer animate-in fade-in slide-in-from-left-4 duration-300",
                isCurrent && "bg-white/5"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => {
                if (isCurrent) togglePlayPause();
                else playTrack(track);
              }}
            >
              <div className="w-10 text-center text-gray-400 tabular-nums relative">
                <span className={cn("group-hover:hidden", isCurrent && "text-green-500")}>
                  {index + 1}
                </span>
                <Play className={cn("size-4 mx-auto hidden group-hover:block", isCurrent ? "text-green-500 fill-green-500" : "text-white fill-white")} />
              </div>

              <div className="flex items-center flex-1 ml-4 min-w-0">
                <div className="relative size-10 rounded shadow-lg mr-3 overflow-hidden bg-white/10 flex-shrink-0">
                   <img src={track.imageUrl} alt="" className="object-cover w-full h-full" />
                </div>
                <div className="min-w-0">
                  <div className={cn("font-medium truncate", isCurrent ? "text-green-500" : "text-white")}>
                    {track.name}
                  </div>
                  <div className="text-xs text-gray-400 truncate font-normal">
                    {track.artist}
                  </div>
                </div>
              </div>

              <div className="w-32 hidden md:block text-xs text-gray-400 truncate">
                {track.album}
              </div>

              <div className="w-20 text-right pr-4 text-xs text-gray-400 tabular-nums flex items-center justify-end gap-4">
                <span>{formatDuration(track.duration)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-8 text-gray-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity",
                    savingId === track.id && "animate-pulse"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveTrack(track);
                  }}
                >
                   {savingId === track.id ? <Loader2 className="size-4 animate-spin text-[#1db954]" /> : <Plus className="size-4" />}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
