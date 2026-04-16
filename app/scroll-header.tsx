'use client';

import { useEffect, useState } from 'react';
import { SearchInput } from './search';
import { UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScrollHeader({ query }: { query?: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.scrollTop > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  return (
    <header 
      className={cn(
        "absolute top-0 inset-x-0 z-20 h-16 flex items-center justify-between px-6 transition-all duration-300",
        scrolled ? "bg-[#121212] border-b border-white/5 shadow-md" : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="flex items-center gap-2">
        <SearchInput value={query} />
      </div>
      <div className="flex items-center gap-3">
        <button className="hidden sm:block text-sm font-bold hover:scale-105 transition-transform text-black bg-white px-4 py-1.5 rounded-full">
          Explorar Premium
        </button>
        <div className="size-8 rounded-full bg-black/50 flex items-center justify-center border border-white/10 cursor-pointer hover:bg-black/80 transition-colors">
          <UserRound className="size-4 text-gray-300" />
        </div>
      </div>
    </header>
  );
}
