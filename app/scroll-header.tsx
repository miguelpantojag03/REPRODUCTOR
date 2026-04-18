'use client';

import { useEffect, useState } from 'react';
import { SearchInput } from './search';
import { KeyboardShortcuts } from './keyboard-shortcuts';
import { cn } from '@/lib/utils';

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
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        <KeyboardShortcuts />
      </div>
    </header>
  );
}
