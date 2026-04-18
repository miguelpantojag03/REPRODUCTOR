'use client';

import { useEffect, useState } from 'react';
import { SearchInput } from './search';
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
        scrolled
          ? 'bg-[#121212]/90 backdrop-blur-md border-b border-white/5 shadow-md'
          : 'bg-transparent'
      )}
    >
      {/* Search — full width on mobile, fixed width on desktop */}
      <div className="flex-1 sm:flex-none">
        <SearchInput value={query} />
      </div>

      {/* Right actions */}
      <div className="hidden sm:flex items-center gap-2 ml-3">
        <KeyboardShortcuts />
      </div>
    </header>
  );
}
