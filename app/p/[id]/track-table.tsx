'use client';

import { usePlayback } from '@/app/playback-context';
import { Song, PlaylistWithSongs } from '@/lib/db/types';
import { formatDuration, highlightText, getValidImageUrl, cn } from '@/lib/utils';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Play, Pause, Plus, Loader2, Heart, Trash2 } from 'lucide-react';
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
import Image from 'next/image';
import { toggleFavoriteAction } from '@/app/actions';

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
    reorderTrack,
    playlist,
  } = usePlayback();
  
  const [isLiked, setIsLiked] = useState(Boolean((track as any).favorite));
  const isCurrentTrack = currentTrack?.id === track.id;

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    const nextState = !isLiked;
    setIsLiked(nextState);
    const result = await toggleFavoriteAction(track.id, nextState);
    if (!result.success) setIsLiked(!nextState);
  }

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
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClickTrackRow(e as any);
        } else {
          handleKeyNavigation(e, 'tracklist');
        }
      }}
    >
      <td className="py-2 pl-3 pr-2 tabular-nums w-10 text-center relative">
        <div className="flex items-center justify-center">
          {isCurrentTrack && isPlaying ? (
            <div className="flex items-end justify-center space-x-[2px] h-[10px]">
              <div className="w-1 bg-green-500 animate-now-playing-1"></div>
              <div className="w-1 bg-green-500 animate-now-playing-2 [animation-delay:0.2s]"></div>
              <div className="w-1 bg-green-500 animate-now-playing-3 [animation-delay:0.4s]"></div>
            </div>
          ) : (
            <span className={cn("text-gray-400 group-hover:hidden", isCurrentTrack && "text-green-500")}>
              {index + 1}
            </span>
          )}
          <Play className={cn("size-3 hidden group-hover:block", isCurrentTrack ? "text-green-500" : "text-white")} fill="currentColor" />
        </div>
      </td>
      <td className="py-2 px-2">
        <div className="flex items-center">
          <div className="relative size-10 mr-3 overflow-hidden rounded bg-[#282828]">
            <Image
              src={getValidImageUrl(track.imageUrl)}
              alt={track.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className={cn("font-medium truncate max-w-[200px] md:max-w-[400px]", isCurrentTrack ? "text-green-500" : "text-white")}>
              {highlightText(track.name, query)}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {highlightText(track.artist, query)}
            </div>
          </div>
        </div>
      </td>
      <td className="py-2 px-2 hidden md:table-cell text-gray-400 truncate max-w-[150px]">
        {highlightText(track.album || '-', query)}
      </td>
      <td className="py-2 px-2 text-right">
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-transparent"
            onClick={handleToggleFavorite}
          >
            <Heart className={cn("size-4", isLiked ? "text-green-500 fill-green-500" : "text-gray-400 hover:text-white")} />
          </Button>
          <span className="text-xs tabular-nums text-gray-400 min-w-[35px] text-right">
            {formatDuration(track.duration)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-[#282828] border-white/5 text-white">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); playTrack(track); }}>
                <Play className="mr-2 size-4" /> Reproducir ahora
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Plus className="mr-2 size-4" /> Agregar a...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-[#282828] border-white/5">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); reorderTrack(track.id, 0); }}>Mover al inicio</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); reorderTrack(track.id, playlist.length - 1); }}>Mover al final</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}>
                <Trash2 className="mr-2 size-4" /> Quitar de la lista
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

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
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSongs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/songs');
      setPlaylist(response.data);
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
  }, [registerPanelRef, fetchSongs, playlistProp, setPlaylist]);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        <p className="text-gray-400 text-sm">Cargando biblioteca...</p>
      </div>
    );
  }

  let filteredSongs = playlist;
  if (query) {
    const q = query.toLowerCase();
    filteredSongs = filteredSongs.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.artist.toLowerCase().includes(q) ||
      (s.album && s.album.toLowerCase().includes(q))
    );
  }
  
  if (liked) {
    filteredSongs = filteredSongs.filter(s => (s as any).favorite);
  }

  return (
    <div className="px-4 pb-32">
      <table
        ref={tableRef}
        className="w-full text-left"
        onClick={() => setActivePanel('tracklist')}
      >
        <thead className="sticky top-16 bg-[#121212] z-10 border-b border-white/5 py-3">
          <tr className="text-gray-400 uppercase text-[10px] tracking-widest font-bold">
            <th className="py-3 px-3 w-10 text-center">#</th>
            <th className="py-3 px-2">Título</th>
            <th className="py-3 px-2 hidden md:table-cell">Álbum</th>
            <th className="py-3 px-2 text-right pr-6">Acciones</th>
          </tr>
        </thead>
        <tbody className="before:content-['-'] before:block before:leading-[1em] before:text-transparent">
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
      {filteredSongs.length === 0 && (
        <div className="py-20 text-center text-gray-500 text-sm italic">
          No hay canciones para mostrar.
        </div>
      )}
    </div>
  );
}
