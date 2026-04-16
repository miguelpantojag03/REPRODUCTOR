'use client';

import { Song } from '@/lib/db/types';
import { formatDuration, getValidImageUrl } from '@/lib/utils';
import { usePlayback } from '@/app/playback-context';
import { Button } from '@/components/ui/button';
import { Play, Heart, Globe, Plus, Loader2, ListPlus, ListMusic } from 'lucide-react';
import { saveOnlineTrackAction, addToPlaylistAction } from './actions';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from './toast-provider';
import { usePlaylist } from '@/app/hooks/use-playlist';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function OnlineResults({ tracks }: { tracks: any[] }) {
  const { playTrack, currentTrack, isPlaying, togglePlayPause, addToQueue } = usePlayback();
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { playlists } = usePlaylist();

  const handleSaveTrack = async (track: any) => {
    setSavingId(track.id);
    try {
      const result = await saveOnlineTrackAction(track);
      if (result.success) {
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

  const handleAddToPlaylist = async (track: any, playlistId: string, playlistName: string) => {
    // First save the track to DB, then add to specific playlist
    try {
      const result = await saveOnlineTrackAction(track);
      if (result.success && result.songId) {
        const addResult = await addToPlaylistAction(playlistId, result.songId);
        if (addResult.success) {
          toast(`"${track.name}" añadida a "${playlistName}"`, 'success');
        } else {
          toast(addResult.message || 'Ya está en la lista', 'info');
        }
      }
    } catch (err) {
      console.error(err);
      toast('Error al añadir a la lista', 'error');
    }
  };

  if (!tracks || tracks.length === 0) return null;

  return (
    <section className="mt-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="size-5 text-indigo-400" />
        <h2 className="text-2xl font-bold">Resultados Globales</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-[2px]">
        <div className="flex items-center text-gray-400 text-[10px] uppercase tracking-widest px-4 py-2 border-b border-white/5 bg-[#121212]/50">
          <span className="w-10 text-center">#</span>
          <span className="flex-1 ml-4">Título</span>
          <span className="w-32 hidden md:block">Álbum</span>
          <span className="w-32 text-right">Acciones</span>
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
              style={{ animationDelay: `${index * 40}ms` }}
              onClick={() => {
                if (isCurrent) togglePlayPause();
                else playTrack(track);
              }}
            >
              <div className="w-10 text-center text-gray-400 tabular-nums relative">
                <span className={cn("group-hover:hidden", isCurrent && "text-green-500")}>
                  {isCurrent && isPlaying ? (
                    <span className="flex items-end justify-center gap-[2px] h-3">
                      <span className="w-[3px] bg-green-500 animate-now-playing-1 rounded-sm" />
                      <span className="w-[3px] bg-green-500 animate-now-playing-2 rounded-sm" />
                      <span className="w-[3px] bg-green-500 animate-now-playing-3 rounded-sm" />
                    </span>
                  ) : (
                    index + 1
                  )}
                </span>
                <Play className={cn("size-4 mx-auto hidden group-hover:block", isCurrent ? "text-green-500 fill-green-500" : "text-white fill-white")} />
              </div>

              <div className="flex items-center flex-1 ml-4 min-w-0">
                <div className="relative size-10 rounded shadow-lg mr-3 overflow-hidden bg-white/10 flex-shrink-0">
                   <img src={getValidImageUrl(track.imageUrl)} alt="" className="object-cover w-full h-full" />
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

              <div className="w-32 text-right text-xs text-gray-400 tabular-nums flex items-center justify-end gap-1">
                <span className="mr-2">{formatDuration(track.duration)}</span>
                
                {/* Save to library */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-8 text-gray-400 hover:text-[#1db954] hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all",
                    savingId === track.id && "opacity-100"
                  )}
                  onClick={(e) => { e.stopPropagation(); handleSaveTrack(track); }}
                  title="Guardar en biblioteca"
                >
                   {savingId === track.id ? <Loader2 className="size-4 animate-spin text-[#1db954]" /> : <Heart className="size-4" />}
                </Button>

                {/* Add to queue */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-gray-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToQueue(track);
                    toast(`"${track.name}" añadida a la cola`, 'success');
                  }}
                  title="Añadir a la cola"
                >
                  <ListMusic className="size-4" />
                </Button>

                {/* Add to playlist dropdown */}
                {playlists.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-gray-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={(e) => e.stopPropagation()}
                        title="Añadir a playlist"
                      >
                        <Plus className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 bg-[#282828] border-white/10 text-white shadow-2xl">
                      <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Añadir a playlist</div>
                      {playlists.map((pl) => (
                        <DropdownMenuItem
                          key={pl.id}
                          className="text-sm focus:bg-white/10 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); handleAddToPlaylist(track, pl.id, pl.name); }}
                        >
                          <ListPlus className="size-4 mr-2 text-[#1db954]" />
                          {pl.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
