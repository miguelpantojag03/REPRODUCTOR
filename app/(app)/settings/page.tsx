'use client';

import { useState, useEffect } from 'react';
import { usePlayback } from '@/app/playback-context';
import { cn } from '@/lib/utils';
import {
  Settings, Volume2, Gauge, Repeat, Shuffle, Moon, Info,
  ChevronLeft, Music2, Sliders, Bell, Palette,
} from 'lucide-react';
import Link from 'next/link';
import { Slider } from '@/components/ui/slider';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h3 className="text-[11px] uppercase tracking-widest text-[#6b7280] font-bold px-1 mb-2">{title}</h3>
      <div className="bg-[#181818] rounded-xl overflow-hidden border border-white/[0.06] divide-y divide-white/[0.04]">
        {children}
      </div>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-[#6b7280] mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn('w-10 h-5 rounded-full transition-colors relative', value ? 'bg-[#1db954]' : 'bg-white/20')}
    >
      <div className={cn('absolute top-0.5 size-4 bg-white rounded-full shadow transition-transform', value ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  );
}

export default function SettingsPage() {
  const { volume, setVolume, playbackSpeed, setPlaybackSpeed, isShuffle, toggleShuffle, repeatMode, cycleRepeat } = usePlayback();
  const [crossfade, setCrossfade] = useState(() => {
    if (typeof window !== 'undefined') return Number(localStorage.getItem('player-crossfade') ?? 0);
    return 0;
  });
  const [autoplay, setAutoplay] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('player-autoplay') !== 'false';
    return true;
  });
  const [showPlayCount, setShowPlayCount] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('player-show-playcount') !== 'false';
    return true;
  });

  useEffect(() => { localStorage.setItem('player-crossfade', String(crossfade)); }, [crossfade]);
  useEffect(() => { localStorage.setItem('player-autoplay', String(autoplay)); }, [autoplay]);
  useEffect(() => { localStorage.setItem('player-show-playcount', String(showPlayCount)); }, [showPlayCount]);

  const repeatLabels: Record<string, string> = { off: 'Desactivado', all: 'Repetir todo', one: 'Repetir una' };
  const speedLabels: Record<number, string> = { 0.5: '0.5x', 0.75: '0.75x', 1: 'Normal', 1.25: '1.25x', 1.5: '1.5x', 2: '2x' };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#121212] rounded-none md:rounded-xl md:my-2 md:mr-2">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-white/[0.06]">
        <Link href="/" className="size-8 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.10] transition-colors text-[#b3b3b3] hover:text-white">
          <ChevronLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Settings className="size-5 text-[#1db954]" />
          <h1 className="text-lg font-bold text-white">Configuración</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 pb-32 md:pb-20">

        {/* Playback */}
        <Section title="Reproducción">
          <Row label="Volumen" description={`${Math.round(volume)}%`}>
            <div className="w-32">
              <Slider value={[volume]} min={0} max={100} step={1} onValueChange={([v]) => setVolume(v)} />
            </div>
          </Row>
          <Row label="Velocidad de reproducción" description={speedLabels[playbackSpeed] || `${playbackSpeed}x`}>
            <div className="flex gap-1">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={cn('px-2 py-1 rounded text-xs font-medium transition-colors', playbackSpeed === s ? 'bg-[#1db954] text-black' : 'bg-white/[0.07] text-[#b3b3b3] hover:bg-white/[0.12]')}
                >
                  {s === 1 ? '1x' : `${s}x`}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Modo aleatorio" description="Mezcla el orden de reproducción">
            <Toggle value={isShuffle} onChange={toggleShuffle} />
          </Row>
          <Row label="Repetición" description={repeatLabels[repeatMode]}>
            <button
              onClick={cycleRepeat}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', repeatMode !== 'off' ? 'bg-[#1db954] text-black' : 'bg-white/[0.07] text-[#b3b3b3] hover:bg-white/[0.12]')}
            >
              {repeatLabels[repeatMode]}
            </button>
          </Row>
          <Row label="Reproducción automática" description="Continuar reproduciendo al terminar la cola">
            <Toggle value={autoplay} onChange={setAutoplay} />
          </Row>
          <Row label="Crossfade" description={crossfade === 0 ? 'Desactivado' : `${crossfade}s entre canciones`}>
            <div className="flex items-center gap-3 w-40">
              <Slider
                value={[crossfade]}
                min={0} max={12} step={1}
                onValueChange={([v]) => setCrossfade(v)}
              />
              <span className="text-xs text-[#b3b3b3] w-6 text-right tabular-nums">{crossfade}s</span>
            </div>
          </Row>
        </Section>

        {/* Display */}
        <Section title="Visualización">
          <Row label="Mostrar contador de plays" description="Muestra cuántas veces has reproducido cada canción">
            <Toggle value={showPlayCount} onChange={setShowPlayCount} />
          </Row>
        </Section>

        {/* Keyboard shortcuts */}
        <Section title="Atajos de teclado">
          {[
            ['Espacio', 'Reproducir / Pausar'],
            ['S', 'Activar/desactivar aleatorio'],
            ['R', 'Cambiar modo repetición'],
            ['M', 'Silenciar / Activar sonido'],
            ['F', 'Marcar como favorito'],
            ['?', 'Mostrar atajos'],
            ['Alt + →', 'Siguiente canción'],
            ['Alt + ←', 'Canción anterior'],
            ['Alt + ↑', 'Subir volumen'],
            ['Alt + ↓', 'Bajar volumen'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-[#b3b3b3]">{desc}</span>
              <kbd className="px-2 py-0.5 bg-white/[0.07] border border-white/[0.10] rounded text-xs text-white font-mono">{key}</kbd>
            </div>
          ))}
        </Section>

        {/* About */}
        <Section title="Acerca de">
          <Row label="Reproductor de Música" description="Versión 2.0 — Construido con Next.js">
            <Music2 className="size-5 text-[#1db954]" />
          </Row>
        </Section>
      </div>
    </div>
  );
}
