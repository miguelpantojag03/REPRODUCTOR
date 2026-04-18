'use client';

import { useEffect, useState } from 'react';
import { SearchInput } from './search';
import { UserRound } from 'lucide-react';
import { KeyboardShortcuts } from './keyboard-shortcuts';
import { cn } from '@/lib/utils';

export function ScrollHeader({ query }: { query?: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setScrolled(target.scrollTop > 50);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  return (
    <header
      className={cn(
        'absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 sm:px-6 transition-all duration-300',
        'h-14 sm:h-16',
        scrolled ? 'bg-[#121212] border-b border-white/5 shadow-md' : 'bg-transparent'
      )}
    >
      {/* Search — full width on mobile, fixed width on desktop */}
      <div className="flex-1 sm:flex-none">
        <SearchInput value={query} />
      </div>

      {/* Right actions — hidden on mobile to save space */}
      <div className="hidden sm:flex items-center gap-3 ml-3">
        <KeyboardShortcuts />
        <button className="text-sm font-bold hover:scale-105 transition-transform text-black bg-white px-4 py-1.5 rounded-full whitespace-nowrap">
          Explorar Premium
        </button>
        <div className="size-8 rounded-full bg-black/50 flex items-center justify-center border border-white/10 cursor-pointer hover:bg-black/80 transition-colors flex-shrink-0">
          <UserRound className="size-4 text-gray-300" />
        </div>
      </div>
    </header>
  );
}
