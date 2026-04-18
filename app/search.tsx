'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchInput({ value: initialValue }: { value?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    router.replace(`/?q=${encodeURIComponent(value)}`);
  }, [value, router]);

  return (
    <div className="relative w-full sm:w-72 group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6b7280] group-focus-within:text-white transition-colors pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Buscar canciones, artistas..."
        className={cn(
          'w-full h-10 bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.14]',
          'rounded-full pl-10 pr-10 text-sm text-white placeholder-[#6b7280]',
          'border border-transparent focus:border-white/20',
          'outline-none transition-all duration-200',
          '[&::-webkit-search-cancel-button]:appearance-none'
        )}
        style={{ WebkitAppearance: 'none' }}
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center rounded-full text-[#6b7280] hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
