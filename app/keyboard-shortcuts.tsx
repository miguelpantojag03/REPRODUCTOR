'use client';

import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const shortcuts = [
  { keys: ['Space'], description: 'Reproducir / Pausar' },
  { keys: ['←'], description: 'Canción anterior' },
  { keys: ['→'], description: 'Siguiente canción' },
  { keys: ['↑'], description: 'Subir volumen' },
  { keys: ['↓'], description: 'Bajar volumen' },
  { keys: ['S'], description: 'Activar/desactivar aleatorio' },
  { keys: ['R'], description: 'Cambiar modo repetición' },
  { keys: ['M'], description: 'Silenciar / Activar sonido' },
  { keys: ['F'], description: 'Marcar como favorito' },
  { keys: ['?'], description: 'Mostrar atajos de teclado' },
  { keys: ['J', 'K'], description: 'Navegar lista (abajo/arriba)' },
  { keys: ['H', 'L'], description: 'Cambiar panel (izq/der)' },
  { keys: ['Enter'], description: 'Reproducir canción seleccionada' },
];

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '?') setIsOpen((p) => !p);
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-1.5 text-[#b3b3b3] hover:text-white transition-colors text-xs"
        title="Atajos de teclado (?)"
      >
        <Keyboard className="size-4" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Keyboard className="size-5 text-[#1db954]" />
                <h2 className="text-lg font-bold text-white">Atajos de teclado</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="size-5" />
              </button>
            </div>
            <div className="p-6 space-y-2 max-h-[70vh] overflow-y-auto">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-gray-300">{s.description}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-2 py-0.5 bg-white/10 border border-white/20 rounded text-xs text-white font-mono min-w-[28px] text-center"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-white/5 text-center">
              <p className="text-xs text-gray-500">Presiona <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono">?</kbd> para abrir/cerrar</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
