'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MoreVertical, Trash, Home, Search, Library, Music, Clock } from 'lucide-react';
import { useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { usePlayback } from '@/app/playback-context';
import { createPlaylistAction, deletePlaylistAction } from './actions';
import { usePlaylist } from '@/app/hooks/use-playlist';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Playlist } from '@/lib/db/types';
import { v4 as uuidv4 } from 'uuid';
import { UploadButton } from '@/components/upload-button';
import { cn } from '@/lib/utils';

let isProduction = false; // Allow all features everywhere

function PlaylistRow({ playlist }: { playlist: Playlist }) {
  let pathname = usePathname();
  let router = useRouter();
  let { deletePlaylist } = usePlaylist();

  async function handleDeletePlaylist(id: string) {
    deletePlaylist(id);

    if (pathname === `/p/${id}`) {
      router.prefetch('/');
      router.push('/');
    }

    deletePlaylistAction(id);
    router.refresh();
  }

  const isActive = pathname === `/p/${playlist.id}`;

  return (
    <li className="group relative transition-all duration-200 list-none">
      <Link
        prefetch={true}
        href={`/p/${playlist.id}`}
        className={cn(
          "flex items-center gap-3 py-2 px-2 rounded-md cursor-pointer transition-colors focus:outline-none",
          isActive ? "bg-[#333333] text-white font-medium" : "text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a]"
        )}
        tabIndex={0}
      >
        <div className="flex-shrink-0 size-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden relative">
          {playlist.coverUrl ? (
            <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <Music className="w-5 h-5 text-indigo-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="truncate block text-sm">{playlist.name}</span>
          <span className="text-xs text-gray-500">Lista de reproducción</span>
        </div>
      </Link>
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Playlist options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 border-[#333] bg-[#282828] text-white shadow-xl">
            <DropdownMenuItem
              disabled={isProduction}
              onClick={() => handleDeletePlaylist(playlist.id)}
              className="text-xs text-red-400 focus:bg-white/10 focus:text-red-400 hover:cursor-pointer"
            >
              <Trash className="mr-2 size-3.5" />
              Eliminar la playlist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

function LikedSongsRow() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLiked = searchParams.get('liked') === 'true';

  return (
    <li className="group relative transition-all duration-200 list-none mb-1">
      <Link
        href="/?liked=true"
        className={cn(
          "flex items-center gap-3 py-2 px-2 rounded-md cursor-pointer transition-colors focus:outline-none",
          pathname === '/' && isLiked ? "bg-[#333333] text-white font-medium" : "text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a]"
        )}
      >
        <div className="flex-shrink-0 size-12 bg-gradient-to-br from-[#450af5] to-[#c4efd9] rounded flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="#fff"><path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.21 5.855l5.916 7.05a1.128 1.128 0 0 0 1.727 0l5.916-7.05a4.228 4.228 0 0 0 .945-3.577z"></path></svg>
        </div>
        <div>
          <span className="block truncate text-base font-medium">Tus me gusta</span>
          <span className="block text-sm text-[#b3b3b3] mt-0.5">Lista • Auto</span>
        </div>
      </Link>
    </li>
  );
}

export function OptimisticPlaylists() {
  let { playlists, updatePlaylist } = usePlaylist();
  let playlistsContainerRef = useRef<HTMLUListElement>(null);
  let pathname = usePathname();
  let router = useRouter();
  let { registerPanelRef, handleKeyNavigation, setActivePanel } = usePlayback();

  useEffect(() => {
    registerPanelRef('sidebar', playlistsContainerRef);
  }, [registerPanelRef]);

  async function addPlaylistAction() {
    let newPlaylistId = uuidv4();
    let newPlaylist = {
      id: newPlaylistId,
      name: 'Nueva Lista',
      coverUrl: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    updatePlaylist(newPlaylistId, newPlaylist);
    router.prefetch(`/p/${newPlaylistId}`);
    router.push(`/p/${newPlaylistId}`);
    createPlaylistAction(newPlaylistId, 'Nueva Lista');
    router.refresh();
  }

  return (
    <div
      className="hidden md:flex flex-col w-[320px] bg-black h-[100dvh] overflow-hidden p-2 gap-2"
      onClick={() => setActivePanel('sidebar')}
    >
      {/* Top Panel: Home & Search */}
      <div className="bg-[#121212] rounded-lg px-3 py-4 space-y-4">
        {/* Upload can stay here modestly */}
        <div className="px-2 mb-2">
          <UploadButton />
        </div>
        
        <nav className="space-y-1">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-4 px-3 py-1 rounded-md font-bold transition-colors text-[15px]",
              pathname === '/' ? "text-white" : "text-[#b3b3b3] hover:text-white"
            )}
          >
            <Home className={cn("size-6", pathname === '/' ? "fill-white" : "stroke-2")} />
            Inicio
          </Link>
          <button
            onClick={() => {
              const el = document.querySelector('input[type="search"]') as HTMLInputElement;
              if (el) el.focus();
            }}
            className="w-full flex items-center gap-4 px-3 py-1 rounded-md font-bold text-[#b3b3b3] hover:text-white transition-colors text-[15px] group"
          >
            <Search className="size-6 stroke-2 group-hover:text-white transition-colors" />
            Buscar
          </button>
          <Link
            href="/history"
            className={cn(
              "flex items-center gap-4 px-3 py-1 rounded-md font-bold transition-colors text-[15px]",
              pathname === '/history' ? "text-white" : "text-[#b3b3b3] hover:text-white"
            )}
          >
            <Clock className={cn("size-6", pathname === '/history' ? "fill-white" : "stroke-2")} />
            Historial
          </Link>
        </nav>
      </div>

      {/* Bottom Panel: Your Library */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#121212] rounded-lg pb-[80px] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between group">
          <button className="flex items-center gap-3 text-[#b3b3b3] hover:text-white transition-colors font-bold text-[15px] cursor-pointer">
            <Library className="size-6 stroke-2" />
            Tu biblioteca
          </button>
          <form action={addPlaylistAction}>
            <Button
              disabled={isProduction}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a] rounded-full"
              type="submit"
              title="Crear lista"
            >
              <Plus className="size-[18px]" />
            </Button>
          </form>
        </div>

        <ScrollArea className="flex-1">
          <ul
            ref={playlistsContainerRef}
            className="px-2"
            onKeyDown={(e) => handleKeyNavigation(e, 'sidebar')}
          >
            {/* Liked Songs Static Row */}
            <Suspense fallback={<li className="h-14 mb-1"></li>}>
              <LikedSongsRow />
            </Suspense>

            {playlists.map((playlist) => (
               <PlaylistRow key={playlist.id} playlist={playlist} />
            ))}
          </ul>
        </ScrollArea>
      </div>
    </div>
  );
}
