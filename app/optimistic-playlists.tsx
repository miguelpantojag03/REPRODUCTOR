'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MoreVertical, Trash, Home, Search, Library, Music, Clock, Heart, TrendingUp, Settings } from 'lucide-react';
import { useRef, useEffect, Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { usePlayback } from '@/app/playback-context';
import { createPlaylistAction, deletePlaylistAction } from './actions';
import { usePlaylist } from '@/app/hooks/use-playlist';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Playlist } from '@/lib/db/types';
import { v4 as uuidv4 } from 'uuid';
import { cn, getValidImageUrl } from '@/lib/utils';

/* ── Playlist Row ─────────────────────────────────────────────── */
function PlaylistRow({ playlist }: { playlist: Playlist }) {
  const pathname = usePathname();
  const router = useRouter();
  const { deletePlaylist } = usePlaylist();
  const isActive = pathname === `/p/${playlist.id}`;

  async function handleDelete(id: string) {
    deletePlaylist(id);
    if (pathname === `/p/${id}`) router.push('/');
    deletePlaylistAction(id);
    router.refresh();
  }

  return (
    <li className="group relative list-none">
      <Link
        prefetch
        href={`/p/${playlist.id}`}
        className={cn(
          'flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all duration-150 focus:outline-none',
          isActive
            ? 'bg-white/10 text-white'
            : 'text-[#b3b3b3] hover:text-white hover:bg-white/[0.06]'
        )}
        tabIndex={0}
      >
        {/* Cover */}
        <div className="size-9 rounded-md overflow-hidden flex-shrink-0 bg-[#282828] shadow-sm">
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
          <p className="text-[11px] text-[#6b7280] leading-tight mt-0.5">Lista</p>
        </div>
      </Link>

      {/* Delete button */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#6b7280] hover:text-white hover:bg-white/10 rounded-md">
              <MoreVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 bg-[#282828] border-white/10 text-white shadow-2xl rounded-xl">
            <DropdownMenuItem
              onClick={() => handleDelete(playlist.id)}
              className="text-xs text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-lg"
            >
              <Trash className="mr-2 size-3.5" /> Eliminar playlist
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
          'flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all duration-150 focus:outline-none',
          isActive ? 'bg-white/10 text-white' : 'text-[#b3b3b3] hover:text-white hover:bg-white/[0.06]'
        )}
      >
        <div className="size-9 rounded-md overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center shadow-sm">
          <Heart className="size-4 text-white fill-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">Tus me gusta</p>
          <p className="text-[11px] text-[#6b7280] leading-tight mt-0.5">Lista automática</p>
        </div>
      </Link>
    </li>
  );
}

/* ── Currently Playing Mini ───────────────────────────────────── */
function NowPlayingMini() {
  const { currentTrack, isPlaying, togglePlayPause } = usePlayback();
  if (!currentTrack) return null;

  return (
    <div className="px-2 py-3 border-t border-white/5">
      <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] transition-colors cursor-pointer group"
        onClick={togglePlayPause}>
        <div className="relative size-8 rounded-md overflow-hidden flex-shrink-0">
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
          <p className="text-[10px] text-[#6b7280] truncate leading-tight mt-0.5">{currentTrack.artist}</p>
        </div>
        <div className={cn('size-2 rounded-full flex-shrink-0', isPlaying ? 'bg-[#1db954]' : 'bg-[#6b7280]')} />
      </div>
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

  const navItems = [
    { href: '/', label: 'Inicio', icon: Home, active: pathname === '/' && !new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('liked') },
    { href: '/history', label: 'Historial', icon: Clock, active: pathname === '/history' },
    { href: '/?liked=true', label: 'Me gusta', icon: Heart, active: pathname === '/' },
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-[260px] bg-[#0a0a0a] h-[100dvh] overflow-hidden gap-2 p-2"
      onClick={() => setActivePanel('sidebar')}
    >
      {/* ── Nav Panel ── */}
      <div className="bg-[#121212] rounded-xl px-2 py-3 space-y-0.5">
        <NavItem href="/" label="Inicio" icon={Home} active={pathname === '/' && !new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('liked')} />
        <NavItem href="/history" label="Historial" icon={Clock} active={pathname === '/history'} />
        <NavItem href="/?liked=true" label="Me gusta" icon={Heart} active={false} />
        <NavItem href="/settings" label="Configuración" icon={Settings} active={pathname === '/settings'} />
      </div>

      {/* ── Library Panel ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#121212] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#b3b3b3]">
            <Library className="size-4" />
            <span className="text-sm font-bold">Tu biblioteca</span>
            <span className="text-[10px] bg-white/10 text-[#6b7280] rounded-full px-1.5 py-0.5 tabular-nums">
              {playlists.length}
            </span>
          </div>
          <button
            onClick={addPlaylist}
            className="size-7 rounded-full flex items-center justify-center text-[#b3b3b3] hover:text-white hover:bg-white/10 transition-colors"
            title="Nueva playlist"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {/* Search playlists */}
        {playlists.length > 4 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[#6b7280]" />
              <input
                type="text"
                placeholder="Buscar en biblioteca..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/[0.06] rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
          </div>
        )}

        {/* List */}
        <ScrollArea className="flex-1 px-2">
          <ul
            ref={playlistsContainerRef}
            className="space-y-0.5 pb-2"
            onKeyDown={e => handleKeyNavigation(e, 'sidebar')}
          >
            <Suspense fallback={<li className="h-12" />}>
              <LikedSongsRow />
            </Suspense>
            {filtered.map(pl => <PlaylistRow key={pl.id} playlist={pl} />)}
            {filtered.length === 0 && search && (
              <li className="text-center py-6 text-xs text-[#6b7280]">Sin resultados</li>
            )}
          </ul>
        </ScrollArea>

        {/* Now playing mini */}
        <NowPlayingMini />
      </div>
    </aside>
  );
}

/* ── Nav Item helper ──────────────────────────────────────────── */
function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: any; active: boolean }) {
  const pathname = usePathname();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const isActive = href === '/'
    ? pathname === '/' && searchParams.get('liked') !== 'true'
    : href === '/?liked=true'
    ? pathname === '/' && searchParams.get('liked') === 'true'
    : pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150',
        isActive ? 'text-white bg-white/10' : 'text-[#b3b3b3] hover:text-white hover:bg-white/[0.06]'
      )}
    >
      <Icon className={cn('size-5', isActive ? 'fill-white' : 'stroke-[1.75]')} />
      {label}
    </Link>
  );
}
