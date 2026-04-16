'use client';

import { usePlayback } from '@/app/playback-context';
import { Song, PlaylistWithSongs } from '@/lib/db/types';
import { formatDuration, highlightText, getValidImageUrl } from '@/lib/utils';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Play, Pause, Plus, Loader2 } from 'lucide-react';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlaylist } from '@/app/hooks/use-playlist';
import Image from 'next/image';

function TrackRow({
  track,
  index,
  query,
  isSelected,
  onSelect,
  onDragStart,
  onDrop,
  isDragOver,
  onDragOver,
  onDragLeave,
}: {
  track: Song;
  index: number;
  query?: string;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, targetIndex: number) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
}) {
  const {
    currentTrack,
    playTrack,
    togglePlayPause,
    isPlaying,
    setActivePanel,
    handleKeyNavigation,
    removeTrack,
    addTrack,
    reorderTrack,
    playlist,
  } = usePlayback();
  
  const isCurrentTrack = currentTrack?.id === track.id;

  function onClickTrackRow(e: React.MouseEvent) {
    e.preventDefault();
    setActivePanel('tracklist');
    onSelect();
    if (isCurrentTrack) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  }

  function onKeyDownTrackRow(e: React.KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
      if (isCurrentTrack) {
        togglePlayPause();
      } else {
        playTrack(track);
      }
    } else {
      handleKeyNavigation(e, 'tracklist');
    }
  }

  return (
    <tr
      draggable
      onDragStart={(e) => onDragStart(e, track.id)}
      onDragOver={(e) => onDragOver(e)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      className={cn(
        "group cursor-pointer hover:bg-white/10 select-none relative transition-colors duration-100",
        isCurrentTrack && "bg-white/5",
        isDragOver && "border-t-2 border-[#1db954] bg-[#1db954]/5"
      )}
      tabIndex={0}
      onClick={onClickTrackRow}
      onKeyDown={onKeyDownTrackRow}
    >
      <td className="py-[2px] pl-3 pr-2 tabular-nums w-10 text-center relative group-hover:hidden">
        {isCurrentTrack && isPlaying ? (
          <div className="flex items-end justify-center space-x-[2px] size-[0.65rem] mx-auto">
            <div className="w-1 bg-green-500 animate-now-playing-1"></div>
            <div className="w-1 bg-green-500 animate-now-playing-2 [animation-delay:0.2s]"></div>
            <div className="w-1 bg-green-500 animate-now-playing-3 [animation-delay:0.4s]"></div>
          </div>
        ) : (
          <span className={cn("text-gray-400 group-hover:hidden", isCurrentTrack && "text-green-500")}>
            {index + 1}
          </span>
        )}
      </td>
      <td className="py-[2px] pl-3 pr-2 tabular-nums w-10 text-center hidden group-hover:table-cell">
         <Play className={cn("size-4 mx-auto", isCurrentTrack ? "text-green-500" : "text-white")} fill="currentColor" onClick={(e) => { e.stopPropagation(); playTrack(track);}}/>
      </td>
      <td className="py-[2px] px-2">
        <div className="flex items-center">
          <div className="relative size-8 mr-3 overflow-hidden rounded">
            <Image
              src={getValidImageUrl(track.imageUrl)}
              alt={`${track.name} cover`}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className={cn("font-medium truncate max-w-[180px] sm:max-w-[240px]", isCurrentTrack ? "text-green-500" : "text-white")}>
              {highlightText(track.name, query)}
            </div>
            <div className="text-[10px] text-gray-400 truncate max-w-[180px] sm:max-w-[240px]">
              {highlightText(track.artist, query)}
            </div>
          </div>
        </div>
      </td>
      <td className="py-[2px] px-2 hidden md:table-cell text-gray-400 truncate">
        {highlightText(track.album || '-', query)}
      </td>
      <td className="py-[2px] px-2 tabular-nums text-gray-400">
        {formatDuration(track.duration)}
      </td>
      <td className="py-[2px] px-2 text-right pr-4">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#282828] border-[#3E3E3E] text-white">
              <DropdownMenuItem
                className="text-xs focus:bg-[#3E3E3E]"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isCurrentTrack) togglePlayPause();
                  else playTrack(track);
                }}
              >
                {isCurrentTrack && isPlaying ? <Pause className="mr-2 size-3" /> : <Play className="mr-2 size-3" />}
                {isCurrentTrack && isPlaying ? 'Pausar' : 'Reproducir'}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs focus:bg-[#3E3E3E]">
                  <Plus className="mr-2 size-3" />
                  Agregar a la cola...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-[#282828] border-[#3E3E3E]">
                  <DropdownMenuItem className="text-xs focus:bg-[#3E3E3E]" onClick={(e) => { e.stopPropagation(); reorderTrack(track.id, 0); }}>Al Inicio</DropdownMenuItem>
                  <DropdownMenuItem className="text-xs focus:bg-[#3E3E3E]" onClick={(e) => { e.stopPropagation(); reorderTrack(track.id, playlist.length - 1); }}>Al Final</DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs focus:bg-[#3E3E3E]"
                    onClick={(e) => {
                      e.stopPropagation();
                      const pos = prompt(`Ingresa la posición (0 a ${playlist.length - 1}):`);
                      if (pos !== null) {
                        const index = parseInt(pos);
                        if (!isNaN(index)) reorderTrack(track.id, index);
                      }
                    }}
                  >
                    En Posición específica...
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                className="text-xs text-red-500 focus:text-red-500 focus:bg-[#3E3E3E]"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTrack(track.id);
                }}
              >
                Eliminar de la Cola
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
      {isSelected && (
        <td className="absolute inset-y-0 left-0 w-1 bg-green-500 pointer-events-none" />
      )}
    </tr>
  );
}

import { cn } from '@/lib/utils';

export function TrackTable({
  query,
  liked,
  playlist: playlistProp,
}: {
  query?: string;
  liked?: boolean;
  playlist?: PlaylistWithSongs;
}) {
  const tableRef = useRef<HTMLTableElement>(null);
  const { registerPanelRef, setActivePanel, setPlaylist, reorderTrack, playlist } = usePlayback();
  const [isClient, setIsClient] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTrackId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedTrackId !== null) {
      reorderTrack(draggedTrackId, targetIndex);
    }
    setDragOverIndex(null);
    setDraggedTrackId(null);
  };

  const fetchSongs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/songs');
      const data = response.data;
      setPlaylist(data);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setPlaylist]);

  useEffect(() => {
    registerPanelRef('tracklist', tableRef);
    
    if (playlistProp) {
      setPlaylist(playlistProp.songs);
      setIsLoading(false);
    } else {
      fetchSongs();
    }
    
    // Listen for refresh events (custom)
    const handleRefresh = () => fetchSongs();
    window.addEventListener('refresh-songs', handleRefresh);
    return () => window.removeEventListener('refresh-songs', handleRefresh);
  }, [registerPanelRef, fetchSongs, playlistProp, setPlaylist]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
        <p className="text-gray-400 text-sm">Cargando biblioteca...</p>
      </div>
    );
  }



  let filteredSongs = playlist;
  if (query) {
    filteredSongs = filteredSongs.filter(s => 
      s.name.toLowerCase().includes(query.toLowerCase()) || 
      s.artist.toLowerCase().includes(query.toLowerCase()) ||
      (s.album && s.album.toLowerCase().includes(query.toLowerCase()))
    );
  }
  
  if (liked) {
    if (isClient) {
      const favorites = JSON.parse(window.localStorage.getItem('favorites') || '[]');
      filteredSongs = filteredSongs.filter(s => favorites.includes(s.id));
    } else {
      filteredSongs = []; // On server render, don't show the list yet or show empty
    }
  }

  return (
    <table
      ref={tableRef}
      className="w-full text-xs"
      onClick={() => setActivePanel('tracklist')}
    >
      <thead className="sticky top-16 bg-[#121212]/95 backdrop-blur-md z-10 border-b border-white/5">
        <tr className="text-left text-gray-400 uppercase text-[10px] tracking-widest">
          <th className="py-3 pl-3 pr-2 font-medium w-10 text-center">#</th>
          <th className="py-3 px-2 font-medium">Título</th>
          <th className="py-3 px-2 font-medium hidden md:table-cell text-left">Álbum</th>
          <th className="py-3 px-2 font-medium w-20">Duración</th>
          <th className="py-3 px-2 font-medium w-10 text-right pr-4"></th>
        </tr>
      </thead>
      <tbody className="mt-[1px]">
        {filteredSongs.map((track, index) => (
          <TrackRow
            key={track.id}
            track={track}
            index={index}
            query={query}
            isSelected={selectedTrackId === track.id}
            onSelect={() => setSelectedTrackId(track.id)}
            onDragStart={handleDragStart}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={handleDrop}
            isDragOver={dragOverIndex === index}
          />
        ))}
      </tbody>
    </table>
  );
}
