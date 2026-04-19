'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchInput({ value: initialValue }: { value?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? '');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced URL update — only fires 400ms after user stops typing
  const updateUrl = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q) setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      router.replace(`/?q=${encodeURIComponent(q)}`, { scroll: false });
      setIsSearching(false);
    }, 400);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    updateUrl(v);
  };

  const handleClear = () => {
    setValue('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsSearching(false);
    router.replace('/', { scroll: false });
    inputRef.current?.focus();
  };

  // Cleanup on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <div className="relative w-full sm:w-72 group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {isSearching
          ? <Loader2 className="size-4 text-[#1db954] animate-spin" />
          : <Search className="size-4 text-[#727272] group-focus-within:text-white transition-colors duration-200" />
        }
      </div>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Buscar canciones, artistas..."
        className={cn(
          'w-full h-10 rounded-full pl-10 pr-10 text-sm',
          'bg-white/[0.08] hover:bg-white/[0.11] focus:bg-white/[0.13]',
          'border border-transparent focus:border-white/20',
          'text-white placeholder-[#727272]',
          'outline-none transition-all duration-200',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
        style={{ WebkitAppearance: 'none' }}
        aria-label="Buscar música"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center rounded-full text-[#727272] hover:text-white hover:bg-white/10 transition-all duration-150"
          aria-label="Limpiar búsqueda"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
