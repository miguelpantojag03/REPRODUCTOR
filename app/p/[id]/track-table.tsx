'use client';

import { usePlayback } from '@/app/playback-context';
import { Song, PlaylistWithSongs } from '@/lib/db/types';
import { formatDuration, highlightText, getValidImageUrl, cn } from '@/lib/utils';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal, Play, Pause, Plus, Loader2, Heart, Trash2,
  ListMusic, ListPlus, ArrowUpToLine, ArrowDownToLine,
  ArrowUpDown, ArrowUp, ArrowDown, Music2, BarChart2,
} from 'lucide-react';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import Link from 'next/link';
import { toggleFavoriteAction, addToPlaylistAction, deleteSongAction } from '@/app/actions';
import { usePlaylist } from '@/app/hooks/use-playlist';
import { useToast } from '@/app/toast-provider';

type SortField = 'name' | 'artist' | 'album' | 'duration' | 'playCount';
type SortDir = 'asc' | 'desc';

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) return <ArrowUpDown className="size-3 ml-1 opacity-40" />;
  return sortDir === 'asc' ? <ArrowUp className="size-3 ml-1 text-[#1db954]" /> : <ArrowDown className="size-3 ml-1 text-[#1db954]" />;
}

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
  onDelete,
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
  onDelete: (id: string) => void;
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
    addToQueue,
    playlist,
  } = usePlayback();
  const { playlists } = usePlaylist();
  const { toast } = useToast();

  const [isLiked, setIsLiked] = useState(Boolean((track as any).favorite));
  const [isDeleting, setIsDeleting] = useState(false);
  const isCurrentTrack = currentTrack?.id === track.id;

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    const nextState = !isLiked;
    setIsLiked(nextState);
    const result = await toggleFavoriteAction(track.id, nextState);
    if (!result.success) setIsLiked(!nextState);
  }

  async function handleDeleteSong(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`¿Eliminar "${track.name}" de la biblioteca? Esta acción no se puede deshacer.`)) return;
    setIsDeleting(true);
    removeTrack(track.id); // Remove from queue immediately
    const result = await deleteSongAction(track.id);
    if (result.success) {
      toast(`"${track.name}" eliminada`, 'success');
      onDelete(track.id);
    } else {
      toast('Error al eliminar la canción', 'error');
      setIsDeleting(false);
    }
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

  const playCount = (track as any).playCount ?? 0;

  return (
    <tr
      draggable
      onDragStart={(e) => onDragStart(e, track.id)}
      onDragOver={(e) => onDragOver(e)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      className={cn(
        'group cursor-pointer hover:bg-white/10 select-none relative transition-colors duration-100',
        isCurrentTrack && 'bg-white/5',
        isDragOver && 'border-t-2 border-[#1db954] bg-[#1db954]/5',
        isDeleting && 'opacity-40 pointer-events-none'
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
      {/* # */}
      <td className="py-2 pl-3 pr-2 tabular-nums w-10 text-center relative">
        <div className="flex items-center justify-center">
          {isCurrentTrack && isPlaying ? (
            <div className="flex items-end justify-center space-x-[2px] h-[10px]">
              <div className="w-1 bg-green-500 animate-now-playing-1" />
              <div className="w-1 bg-green-500 animate-now-playing-2 [animation-delay:0.2s]" />
              <div className="w-1 bg-green-500 animate-now-playing-3 [animation-delay:0.4s]" />
            </div>
          ) : (
            <>
              <span className={cn('text-gray-400 group-hover:hidden', isCurrentTrack && 'text-green-500')}>
                {index + 1}
              </span>
              <Play
                className={cn('size-3 hidden group-hover:block', isCurrentTrack ? 'text-green-500' : 'text-white')}
                fill="currentColor"
              />
            </>
          )}
        </div>
      </td>

      {/* Title + Artist */}
      <td className="py-2 px-2">
        <div className="flex items-center">
          <div className="relative size-10 mr-3 overflow-hidden rounded bg-[#282828] flex-shrink-0">
            <Image src={getValidImageUrl(track.imageUrl)} alt={track.name} fill className="object-cover" />
          </div>
          <div className="min-w-0">
            <div className={cn('font-medium truncate max-w-[180px] md:max-w-[320px]', isCurrentTrack ? 'text-green-500' : 'text-white')}>
              {highlightText(track.name, query)}
            </div>
            <Link
              href={`/artist/${encodeURIComponent(track.artist)}`}
              className="text-xs text-gray-400 truncate hover:text-white hover:underline transition-colors block"
              onClick={e => e.stopPropagation()}
            >
              {highlightText(track.artist, query)}
            </Link>
          </div>
        </div>
      </td>

      {/* Album */}
      <td className="py-2 px-2 hidden md:table-cell text-gray-400 truncate max-w-[150px] text-sm">
        {highlightText(track.album || '—', query)}
      </td>

      {/* Play count */}
      <td className="py-2 px-2 hidden lg:table-cell text-center">
        {playCount > 0 ? (
          <span className="text-xs tabular-nums text-gray-500 flex items-center justify-center gap-1">
            <BarChart2 className="size-3" />
            {playCount}
          </span>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="py-2 px-2 text-right">
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-transparent"
            onClick={handleToggleFavorite}
            title={isLiked ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            <Heart className={cn('size-4', isLiked ? 'text-green-500 fill-green-500' : 'text-gray-400 hover:text-white')} />
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
            <DropdownMenuContent align="end" className="w-56 bg-[#282828] border-white/10 text-white shadow-2xl">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); playTrack(track); }}>
                <Play className="mr-2 size-4" /> Reproducir ahora
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  addToQueue(track);
                  toast(`"${track.name}" añadida a la cola`, 'success');
                }}
              >
                <ListMusic className="mr-2 size-4" /> Añadir a la cola
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); reorderTrack(track.id, 0); }}>
                <ArrowUpToLine className="mr-2 size-4" /> Mover al inicio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); reorderTrack(track.id, playlist.length - 1); }}>
                <ArrowDownToLine className="mr-2 size-4" /> Mover al final
              </DropdownMenuItem>
              {playlists.length > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ListPlus className="mr-2 size-4" /> Añadir a playlist
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-[#282828] border-white/10 max-h-48 overflow-y-auto">
                      {playlists.map((pl) => (
                        <DropdownMenuItem
                          key={pl.id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const result = await addToPlaylistAction(pl.id, track.id);
                            toast(result.message || (result.success ? 'Añadida' : 'Error'), result.success ? 'success' : 'error');
                          }}
                        >
                          {pl.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </>
              )}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                onClick={handleDeleteSong}
              >
                <Trash2 className="mr-2 size-4" /> Eliminar de la biblioteca
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
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [genreFilter, setGenreFilter] = useState<string>('');

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
    if (draggedTrackId !== null) reorderTrack(draggedTrackId, targetIndex);
    setDragOverIndex(null);
    setDraggedTrackId(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleDelete = (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        <p className="text-gray-400 text-sm">Cargando biblioteca...</p>
      </div>
    );
  }

  // Filter out deleted songs
  let filteredSongs = playlist.filter((s) => !deletedIds.has(s.id));

  if (query) {
    const q = query.toLowerCase();
    filteredSongs = filteredSongs.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.album && s.album.toLowerCase().includes(q))
    );
  }

  if (liked) {
    filteredSongs = filteredSongs.filter((s) => (s as any).favorite);
  }

  if (genreFilter) {
    filteredSongs = filteredSongs.filter((s) => s.genre === genreFilter);
  }

  // Sort
  filteredSongs = [...filteredSongs].sort((a, b) => {
    let aVal: any = a[sortField as keyof Song] ?? '';
    let bVal: any = b[sortField as keyof Song] ?? '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Unique genres for filter
  const genres = Array.from(new Set(playlist.map((s) => s.genre).filter(Boolean))) as string[];

  return (
    <div className="px-4 pb-32">
      {/* Filter bar */}
      {!playlistProp && genres.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Género:</span>
          <button
            onClick={() => setGenreFilter('')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              genreFilter === '' ? 'bg-white text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            )}
          >
            Todos
          </button>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenreFilter(g === genreFilter ? '' : g)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                genreFilter === g ? 'bg-[#1db954] text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'
              )}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <table ref={tableRef} className="w-full text-left" onClick={() => setActivePanel('tracklist')}>
        <thead className="sticky top-16 bg-[#121212] z-10 border-b border-white/5">
          <tr className="text-gray-400 uppercase text-[10px] tracking-widest font-bold">
            <th className="py-3 px-3 w-10 text-center">#</th>
            <th className="py-3 px-2">
              <button className="flex items-center hover:text-white transition-colors" onClick={() => handleSort('name')}>
                Título <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
              </button>
            </th>
            <th className="py-3 px-2 hidden md:table-cell">
              <button className="flex items-center hover:text-white transition-colors" onClick={() => handleSort('album')}>
                Álbum <SortIcon field="album" sortField={sortField} sortDir={sortDir} />
              </button>
            </th>
            <th className="py-3 px-2 hidden lg:table-cell text-center">
              <button className="flex items-center justify-center hover:text-white transition-colors mx-auto" onClick={() => handleSort('playCount')}>
                Plays <SortIcon field="playCount" sortField={sortField} sortDir={sortDir} />
              </button>
            </th>
            <th className="py-3 px-2 text-right pr-6">
              <button className="flex items-center ml-auto hover:text-white transition-colors" onClick={() => handleSort('duration')}>
                <SortIcon field="duration" sortField={sortField} sortDir={sortDir} />
              </button>
            </th>
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
              onDelete={handleDelete}
            />
          ))}
        </tbody>
      </table>

      {filteredSongs.length === 0 && (
        <div className="py-20 text-center space-y-3">
          <Music2 className="size-12 text-gray-600 mx-auto" />
          <p className="text-gray-500 text-sm italic">
            {liked ? 'No tienes canciones favoritas aún.' : 'No hay canciones para mostrar.'}
          </p>
        </div>
      )}
    </div>
  );
}
