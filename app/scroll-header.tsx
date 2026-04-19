'use client';

import { useEffect, useState } from 'react';
import { SearchInput } from './search';
import { KeyboardShortcuts } from './keyboard-shortcuts';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogOut, Settings, LogIn, User } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function UserAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    return <img src={image} alt={name ?? ''} className="w-full h-full object-cover" />;
  }
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#1db954] to-indigo-500 flex items-center justify-center">
      <span className="text-xs font-bold text-white">{initials}</span>
    </div>
  );
}

function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="size-8 rounded-full bg-white/10 shimmer flex-shrink-0" />;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 text-xs font-semibold text-[#b3b3b3] hover:text-white transition-all bg-white/[0.07] hover:bg-white/[0.12] px-3 py-1.5 rounded-full border border-white/[0.06] hover:border-white/[0.12]"
      >
        <LogIn className="size-3.5" />
        <span className="hidden sm:inline">Iniciar sesión</span>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="size-8 rounded-full overflow-hidden border-2 border-transparent hover:border-[#1db954]/50 transition-all flex-shrink-0 focus:outline-none focus:border-[#1db954]/50">
          <UserAvatar name={session.user?.name} image={session.user?.image} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-[#1f1f1f] border-white/[0.08] text-white shadow-2xl rounded-xl p-1">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-3 mb-1">
          <div className="size-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
            <UserAvatar name={session.user?.name} image={session.user?.image} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{session.user?.name ?? 'Usuario'}</p>
            <p className="text-xs text-[#727272] truncate">{session.user?.email}</p>
          </div>
        </div>
        <div className="h-px bg-white/[0.06] mx-1 mb-1" />
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-sm">
          <Link href="/settings" className="flex items-center gap-2.5 px-3 py-2">
            <Settings className="size-4 text-[#727272]" />
            Configuración
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-lg text-sm px-3 py-2"
        >
          <LogOut className="size-4 mr-2.5" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ScrollHeader({ query }: { query?: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (e: Event) => setScrolled((e.target as HTMLElement).scrollTop > 40);
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, []);

  return (
    <header
      className={cn(
        'absolute top-0 inset-x-0 z-20 flex items-center gap-3 px-4 sm:px-6 h-14 sm:h-16 transition-all duration-200',
        scrolled
          ? 'bg-[#121212]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="flex-1">
        <SearchInput value={query} />
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden sm:block">
          <KeyboardShortcuts />
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
