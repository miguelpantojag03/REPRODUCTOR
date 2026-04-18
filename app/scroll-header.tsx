'use client';

import { useEffect, useState } from 'react';
import { SearchInput } from './search';
import { KeyboardShortcuts } from './keyboard-shortcuts';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { UserRound, LogOut, Settings, LogIn } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="size-8 rounded-full bg-white/10 shimmer" />;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 text-xs font-semibold text-[#b3b3b3] hover:text-white transition-colors bg-white/[0.07] hover:bg-white/[0.12] px-3 py-1.5 rounded-full"
      >
        <LogIn className="size-3.5" />
        Iniciar sesión
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="size-8 rounded-full overflow-hidden border border-white/10 hover:border-white/30 transition-colors flex-shrink-0 focus:outline-none">
          {session.user?.image ? (
            <img src={session.user.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1db954] to-indigo-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {session.user?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-[#282828] border-white/10 text-white shadow-2xl rounded-xl">
        <div className="px-3 py-2.5 border-b border-white/[0.06]">
          <p className="text-sm font-semibold text-white truncate">{session.user?.name}</p>
          <p className="text-xs text-[#6b7280] truncate">{session.user?.email}</p>
        </div>
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg mt-1">
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="size-4" /> Configuración
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/[0.06]" />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer rounded-lg"
        >
          <LogOut className="size-4 mr-2" /> Cerrar sesión
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
    <header className={cn(
      'absolute top-0 inset-x-0 z-20 flex items-center gap-3 px-4 sm:px-6 h-14 sm:h-16 transition-all duration-200',
      scrolled ? 'bg-[#121212]/95 backdrop-blur-md border-b border-white/[0.06]' : 'bg-transparent'
    )}>
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
