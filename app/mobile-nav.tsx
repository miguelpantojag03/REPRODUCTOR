'use client';

import Link from 'next/link';
import { Home, Search, Library } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-[#282828] z-50 pb-[env(safe-area-inset-bottom)] md:hidden flex justify-around items-center px-4">
      <Link 
        href="/"
        className={cn("flex flex-col items-center justify-center gap-1 w-16", pathname === '/' && !window.location.search.includes('liked') ? "text-white" : "text-[#b3b3b3]")}
      >
        <Home className={cn("size-6 text-white", pathname === '/' && !window.location.search.includes('liked') ? "fill-white" : "stroke-2")} />
        <span className="text-[10px]">Inicio</span>
      </Link>

      <button 
        onClick={() => {
          const el = document.querySelector('input[type="search"]') as HTMLInputElement;
          if (el) el.focus();
        }}
        className="flex flex-col items-center justify-center gap-1 w-16 text-[#b3b3b3] group"
      >
        <Search className="size-6 stroke-2 group-focus:text-white" />
        <span className="text-[10px]">Buscar</span>
      </button>

      <Link 
        href="/?liked=true"
        className={cn("flex flex-col items-center justify-center gap-1 w-16", pathname === '/' && window.location.search.includes('liked') ? "text-white" : "text-[#b3b3b3]")}
      >
        <Library className="size-6 stroke-2" />
        <span className="text-[10px]">Biblioteca</span>
      </Link>
    </nav>
  );
}
