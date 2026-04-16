'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function SearchInput(props: { value?: string }) {
  let router = useRouter();
  let [value, setValue] = useState(props.value ?? '');
  let inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    router.replace(`/?q=${encodeURIComponent(value)}`);
  }, [router, value]);

  return (
    <div className="relative w-64 group">
      <Input
        ref={inputRef}
        type="search"
        className="bg-white/10 border-transparent text-sm h-10 w-full rounded-full pl-10 focus-visible:ring-1 focus-visible:ring-white/30 focus:bg-white/20 transition-all text-white placeholder-gray-400 [&::-webkit-search-cancel-button]:appearance-none"
        style={{
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none',
        }}
        placeholder="¿Qué quieres reproducir?"
        value={value}
        onChange={(e) => {
          setValue(e.currentTarget.value);
        }}
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
         <svg className="w-4 h-4 text-gray-400 group-focus-within:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white rounded-full bg-transparent hover:bg-white/10"
          onClick={() => setValue('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
