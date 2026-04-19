'use client';

import { useState, useEffect, useCallback } from 'react';
import { Music2, Check, ChevronRight, Sparkles, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Popular artists to suggest (mix of genres)
const POPULAR_ARTISTS = [
  // Pop
  { name: 'Taylor Swift',    genre: 'Pop',      emoji: '🎸' },
  { name: 'Bad Bunny',       genre: 'Reggaeton', emoji: '🐰' },
  { name: 'The Weeknd',      genre: 'R&B',       emoji: '🌙' },
  { name: 'Dua Lipa',        genre: 'Pop',       emoji: '💃' },
  { name: 'Harry Styles',    genre: 'Pop',       emoji: '🌈' },
  { name: 'Billie Eilish',   genre: 'Pop',       emoji: '🖤' },
  { name: 'Ariana Grande',   genre: 'Pop',       emoji: '🌸' },
  { name: 'Ed Sheeran',      genre: 'Pop',       emoji: '🎵' },
  // Latin
  { name: 'J Balvin',        genre: 'Reggaeton', emoji: '🌈' },
  { name: 'Maluma',          genre: 'Reggaeton', emoji: '🔥' },
  { name: 'Ozuna',           genre: 'Reggaeton', emoji: '🌊' },
  { name: 'Karol G',         genre: 'Reggaeton', emoji: '💚' },
  { name: 'Shakira',         genre: 'Pop Latino', emoji: '💛' },
  { name: 'Daddy Yankee',    genre: 'Reggaeton', emoji: '👑' },
  // Rock
  { name: 'Coldplay',        genre: 'Rock',      emoji: '🌟' },
  { name: 'Imagine Dragons', genre: 'Rock',      emoji: '🐉' },
  { name: 'Linkin Park',     genre: 'Rock',      emoji: '⚡' },
  { name: 'Red Hot Chili Peppers', genre: 'Rock', emoji: '🌶️' },
  // Hip-Hop
  { name: 'Drake',           genre: 'Hip-Hop',   emoji: '🦉' },
  { name: 'Kendrick Lamar',  genre: 'Hip-Hop',   emoji: '🎤' },
  { name: 'Post Malone',     genre: 'Hip-Hop',   emoji: '🌹' },
  { name: 'Travis Scott',    genre: 'Hip-Hop',   emoji: '🌵' },
  // Electronic
  { name: 'Calvin Harris',   genre: 'Electronic', emoji: '🎛️' },
  { name: 'Martin Garrix',   genre: 'Electronic', emoji: '🦁' },
  { name: 'Marshmello',      genre: 'Electronic', emoji: '🤍' },
  // R&B / Soul
  { name: 'Beyoncé',         genre: 'R&B',       emoji: '👸' },
  { name: 'Bruno Mars',      genre: 'R&B',       emoji: '🪐' },
  { name: 'Frank Ocean',     genre: 'R&B',       emoji: '🌊' },
  // Classic
  { name: 'Michael Jackson', genre: 'Pop',       emoji: '🕺' },
  { name: 'Queen',           genre: 'Rock',      emoji: '👑' },
];

const STORAGE_KEY = 'music-favorite-artists';
const ONBOARDING_KEY = 'music-onboarding-done';

export function getStoredFavoriteArtists(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return true; // SSR: assume done
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
  localStorage.removeItem(STORAGE_KEY);
}

interface OnboardingProps {
  libraryArtists?: string[]; // Artists from user's library
  onComplete: (artists: string[]) => void;
}

export function Onboarding({ libraryArtists = [], onComplete }: OnboardingProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [step, setStep] = useState<'pick' | 'done'>('pick');

  // Merge library artists with popular ones, deduplicate
  const allArtists = [
    ...libraryArtists.map(name => ({ name, genre: 'Tu biblioteca', emoji: '🎵', isLocal: true })),
    ...POPULAR_ARTISTS.filter(a => !libraryArtists.includes(a.name)).map(a => ({ ...a, isLocal: false })),
  ];

  const filtered = search.trim()
    ? allArtists.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    : allArtists;

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleComplete = () => {
    const artists = Array.from(selected);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(artists));
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setStep('done');
    setTimeout(() => onComplete(artists), 800);
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete([]);
  };

  const canContinue = selected.size >= 3;

  if (step === 'done') {
    return (
      <div className="fixed inset-0 z-[500] bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="size-20 bg-[#1db954] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#1db954]/40">
            <Check className="size-10 text-black" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">¡Todo listo!</h2>
          <p className="text-[#727272]">Personalizando tu experiencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#1db954]/8 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/8 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-12 pb-6 text-center">
        <div className="inline-flex items-center justify-center size-14 bg-[#1db954] rounded-2xl shadow-xl shadow-[#1db954]/30 mb-5">
          <Sparkles className="size-7 text-black" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
          ¿Qué música te gusta?
        </h1>
        <p className="text-[#727272] text-sm max-w-sm mx-auto">
          Elige al menos <span className="text-white font-semibold">3 artistas</span> para personalizar tu feed musical
        </p>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className={cn(
                'size-2 rounded-full transition-all duration-300',
                selected.size >= n ? 'bg-[#1db954] scale-125' : 'bg-white/20'
              )}
            />
          ))}
          {selected.size > 3 && (
            <span className="text-xs text-[#1db954] font-bold ml-1">+{selected.size - 3}</span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative z-10 px-4 sm:px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#727272]" />
          <input
            type="text"
            placeholder="Buscar artista..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.07] border border-white/[0.08] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-[#727272] focus:outline-none focus:border-[#1db954]/50 focus:bg-white/[0.09] transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727272] hover:text-white transition-colors">
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Artist grid */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 scrollbar-hide">
        {/* Library artists section */}
        {!search && libraryArtists.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] text-[#727272] uppercase tracking-widest font-bold mb-2 px-1">
              En tu biblioteca
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {libraryArtists.slice(0, 6).map(name => (
                <ArtistCard
                  key={name}
                  name={name}
                  genre="Tu biblioteca"
                  emoji="🎵"
                  selected={selected.has(name)}
                  onToggle={() => toggle(name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Popular artists */}
        {!search && (
          <p className="text-[11px] text-[#727272] uppercase tracking-widest font-bold mb-2 px-1">
            Artistas populares
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(search ? filtered : POPULAR_ARTISTS.filter(a => !libraryArtists.includes(a.name))).map(artist => (
            <ArtistCard
              key={artist.name}
              name={artist.name}
              genre={artist.genre}
              emoji={artist.emoji}
              selected={selected.has(artist.name)}
              onToggle={() => toggle(artist.name)}
            />
          ))}
        </div>

        {filtered.length === 0 && search && (
          <div className="text-center py-12">
            <p className="text-[#727272] text-sm">No encontramos "{search}"</p>
            <button
              onClick={() => { toggle(search); setSearch(''); }}
              className="mt-3 text-[#1db954] text-sm hover:underline"
            >
              Añadir "{search}" como favorito
            </button>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 px-4 sm:px-6 pb-[env(safe-area-inset-bottom)] pt-4 border-t border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-md">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button
            onClick={handleSkip}
            className="text-sm text-[#727272] hover:text-white transition-colors px-4 py-3 flex-shrink-0"
          >
            Omitir
          </button>
          <button
            onClick={handleComplete}
            disabled={!canContinue}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all',
              canContinue
                ? 'bg-[#1db954] hover:bg-[#1ed760] text-black shadow-lg shadow-[#1db954]/20 active:scale-[0.98]'
                : 'bg-white/10 text-[#727272] cursor-not-allowed'
            )}
          >
            {canContinue ? (
              <>
                Continuar con {selected.size} artistas
                <ChevronRight className="size-4" />
              </>
            ) : (
              `Elige ${3 - selected.size} más`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArtistCard({
  name, genre, emoji, selected, onToggle,
}: {
  name: string; genre: string; emoji: string; selected: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-200 text-center active:scale-[0.96]',
        selected
          ? 'bg-[#1db954]/15 border-[#1db954]/60 shadow-lg shadow-[#1db954]/10'
          : 'bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.08] hover:border-white/[0.14]'
      )}
    >
      {/* Check indicator */}
      {selected && (
        <div className="absolute top-2 right-2 size-5 bg-[#1db954] rounded-full flex items-center justify-center">
          <Check className="size-3 text-black" strokeWidth={3} />
        </div>
      )}

      {/* Emoji avatar */}
      <div className={cn(
        'size-12 rounded-full flex items-center justify-center text-2xl transition-transform',
        selected ? 'scale-110' : ''
      )}>
        {emoji}
      </div>

      <div className="min-w-0 w-full">
        <p className={cn('text-xs font-bold truncate', selected ? 'text-white' : 'text-[#b3b3b3]')}>
          {name}
        </p>
        <p className="text-[10px] text-[#727272] truncate mt-0.5">{genre}</p>
      </div>
    </button>
  );
}
