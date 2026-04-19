'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MoreVertical, Trash2, Home, Search, Library, Music, Clock, Heart, Settings, History } from 'lucide-react';
import { useRef, useEffect, Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { usePlayback } from '@/app/playback-context';
import { createPlaylistAction, deletePlaylistAction } from './actions';
import { usePlaylist } from '@/app/hooks/use-playlist';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Playlist } from '@/lib/db/types';
import { v4 as uuidv4 } from 'uuid';
import { cn, getValidImageUrl } from '@/lib/utils';

/* ── Nav Item ─────────────────────────────────────────────────── */
function NavItem({
  href, label, icon: Icon, exact = false,
}: {
  href: string; label: string; icon: any; exact?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLiked = searchParams.get('liked') === 'true';

  let active = false;
  if (href === '/') active = pathname === '/' && !isLiked;
  else if (href === '/?liked=true') active = pathname === '/' && isLiked;
  else active = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
        active
          ? 'bg-white/10 text-white'
          : 'text-[#b3b3b3] hover:text-white hover:bg-white/[0.06] active:bg-white/[0.10]'
      )}
    >
      <Icon className={cn('size-5 flex-shrink-0', active ? 'fill-white' : 'stroke-[1.75]')} />
      {label}
    </Link>
  );
}

/* ── Playlist Row ─────────────────────────────────────────────── */
function PlaylistRow({ playlist }: { playlist: Playlist }) {
  const pathname = usePathname();
  const router = useRouter();
  const { deletePlaylist } = usePlaylist();
  const isActive = pathname === `/p/${playlist.id}`;

  async function handleDelete() {
    deletePlaylist(playlist.id);
    if (pathname === `/p/${playlist.id}`) router.push('/');
    deletePlaylistAction(playlist.id);
    router.refresh();
  }

  return (
    <li className="group relative list-none">
      <Link
        prefetch
        href={`/p/${playlist.id}`}
        className={cn(
          'flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-150 focus:outline-none',
          isActive ? 'bg-white/10 text-white' : 'text-[#b3b3b3] hover:text-white hover:bg-white/[0.06]'
        )}
        tabIndex={0}
      >
        <div className="size-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#282828] shadow-sm">
          {playlist.coverUrl ? (
            <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 flex items-center justify-center">
              <Music className="size-4 text-indigo-300" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate leading-tight">{playlist.name}</p>
          <p className="text-[11px] text-[#727272] leading-tight mt-0.5">Lista</p>
        </div>
      </Link>

      {/* Options */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="size-7 flex items-center justify-center rounded-lg text-[#727272] hover:text-white hover:bg-white/10 transition-colors">
              <MoreVertical className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 bg-[#282828] border-white/10 text-white shadow-2xl rounded-xl">
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-xs text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-lg"
            >
              <Trash2 className="mr-2 size-3.5" /> Eliminar playlist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

/* ── Liked Songs Row ──────────────────────────────────────────── */
function LikedSongsRow() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isActive = pathname === '/' && searchParams.get('liked') === 'true';

  return (
    <li className="list-none">
      <Link
        href="/?liked=true"
        className={cn(
          'flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-150 focus:outline-none',
          isActive ? 'bg-white/10 text-white' : 'text-[#b3b3b3] hover:text-white hover:bg-white/[0.06]'
        )}
      >
        <div className="size-10 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center shadow-sm">
          <Heart className="size-4 text-white fill-white" />
        </div>
        <div>
          <p className="text-sm font-medium leading-tight">Tus me gusta</p>
          <p className="text-[11px] text-[#727272] leading-tight mt-0.5">Lista automática</p>
        </div>
      </Link>
    </li>
  );
}

/* ── Now Playing Mini ─────────────────────────────────────────── */
function NowPlayingMini() {
  const { currentTrack, isPlaying, togglePlayPause } = usePlayback();
  if (!currentTrack) return null;

  return (
    <div className="px-2 py-3 border-t border-white/[0.06]">
      <button
        onClick={togglePlayPause}
        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors group text-left"
      >
        <div className="relative size-9 rounded-lg overflow-hidden flex-shrink-0">
          <img src={getValidImageUrl(currentTrack.imageUrl)} alt="" className="w-full h-full object-cover" />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex items-end gap-[2px] h-3">
                <div className="w-[2px] bg-[#1db954] rounded-sm wave-bar-1" />
                <div className="w-[2px] bg-[#1db954] rounded-sm wave-bar-2" />
                <div className="w-[2px] bg-[#1db954] rounded-sm wave-bar-3" />
              </div>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate leading-tight">{currentTrack.name}</p>
          <p className="text-[10px] text-[#727272] truncate leading-tight mt-0.5">{currentTrack.artist}</p>
        </div>
        <div className={cn('size-2 rounded-full flex-shrink-0 transition-colors', isPlaying ? 'bg-[#1db954]' : 'bg-[#727272]')} />
      </button>
    </div>
  );
}

/* ── Main Sidebar ─────────────────────────────────────────────── */
export function OptimisticPlaylists() {
  const { playlists, updatePlaylist } = usePlaylist();
  const playlistsContainerRef = useRef<HTMLUListElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { registerPanelRef, handleKeyNavigation, setActivePanel } = usePlayback();
  const [search, setSearch] = useState('');

  useEffect(() => {
    registerPanelRef('sidebar', playlistsContainerRef);
  }, [registerPanelRef]);

  async function addPlaylist() {
    const id = uuidv4();
    updatePlaylist(id, { id, name: 'Nueva lista', coverUrl: '', createdAt: new Date(), updatedAt: new Date() });
    router.prefetch(`/p/${id}`);
    router.push(`/p/${id}`);
    createPlaylistAction(id, 'Nueva lista');
    router.refresh();
  }

  const filtered = search
    ? playlists.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : playlists;

  return (
    <aside
      className="hidden md:flex flex-col w-[260px] bg-[#0a0a0a] h-[100dvh] overflow-hidden gap-2 p-2"
      onClick={() => setActivePanel('sidebar')}
    >
      {/* ── Navigation ── */}
      <div className="bg-[#121212] rounded-xl px-2 py-3 space-y-0.5">
        <Suspense fallback={null}>
          <NavItem href="/"           label="Inicio"       icon={Home}    />
          <NavItem href="/history"    label="Historial"    icon={Clock}   />
          <NavItem href="/?liked=true" label="Me gusta"   icon={Heart}   />
          <NavItem href="/settings"   label="Ajustes"      icon={Settings} />
        </Suspense>
      </div>

      {/* ── Library ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#121212] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#b3b3b3]">
            <Library className="size-4" />
            <span className="text-sm font-bold">Tu biblioteca</span>
            {playlists.length > 0 && (
              <span className="text-[10px] bg-white/10 text-[#727272] rounded-full px-1.5 py-0.5 tabular-nums font-medium">
                {playlists.length}
              </span>
            )}
          </div>
          <button
            onClick={addPlaylist}
            className="size-7 rounded-full flex items-center justify-center text-[#b3b3b3] hover:text-white hover:bg-white/10 transition-colors"
            title="Nueva playlist"
            aria-label="Crear nueva playlist"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {/* Search playlists */}
        {playlists.length > 5 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[#727272]" />
              <input
                type="text"
                placeholder="Buscar en biblioteca..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/[0.06] rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-[#727272] focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
          </div>
        )}

        {/* Playlist list */}
        <ScrollArea className="flex-1 px-2">
          <ul
            ref={playlistsContainerRef}
            className="space-y-0.5 pb-2"
            onKeyDown={e => handleKeyNavigation(e, 'sidebar')}
          >
            <Suspense fallback={<li className="h-14" />}>
              <LikedSongsRow />
            </Suspense>
            {filtered.map(pl => <PlaylistRow key={pl.id} playlist={pl} />)}
            {filtered.length === 0 && search && (
              <li className="text-center py-8 text-xs text-[#727272]">Sin resultados</li>
            )}
            {playlists.length === 0 && !search && (
              <li className="text-center py-8 space-y-2">
                <Music className="size-8 text-[#727272] mx-auto" />
                <p className="text-xs text-[#727272]">No tienes playlists aún</p>
                <button onClick={addPlaylist} className="text-xs text-[#1db954] hover:text-[#1ed760] transition-colors">
                  Crear una playlist
                </button>
              </li>
            )}
          </ul>
        </ScrollArea>

        {/* Now playing mini */}
        <NowPlayingMini />
      </div>
    </aside>
  );
}
