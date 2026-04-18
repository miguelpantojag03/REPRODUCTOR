'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayback } from './playback-context';
import { Sliders, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const BANDS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
const BAND_LABELS = ['60Hz', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'];

const PRESETS: Record<string, number[]> = {
  'Normal':     [0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  'Pop':        [1,  3,  4,  3,  1, -1, -1,  1,  2,  3],
  'Rock':       [4,  3,  2,  1, -1, -1,  1,  2,  3,  4],
  'Jazz':       [3,  2,  1,  2, -1, -1,  1,  2,  1,  2],
  'Clásica':    [3,  2,  0,  0, -1, -1,  0,  2,  3,  4],
  'Bass Boost': [6,  5,  4,  2,  0,  0,  0,  0,  0,  0],
  'Vocal':      [-2,-1,  0,  2,  4,  4,  3,  2,  1,  0],
  'Electronic': [4,  3,  1,  0, -1,  2,  1,  2,  3,  4],
  'Treble':     [0,  0,  0,  0,  0,  2,  3,  4,  5,  6],
};

const STORAGE_KEY = 'player-eq';

function loadEQSettings(): { gains: number[]; preset: string; enabled: boolean } {
  if (typeof window === 'undefined') return { gains: new Array(10).fill(0), preset: 'Normal', enabled: false };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { gains: new Array(10).fill(0), preset: 'Normal', enabled: false };
}

export function Equalizer({ onClose }: { onClose: () => void }) {
  const { audioRef } = usePlayback();
  const saved = loadEQSettings();
  const [gains, setGains] = useState<number[]>(saved.gains);
  const [activePreset, setActivePreset] = useState(saved.preset);
  const [isEnabled, setIsEnabled] = useState(saved.enabled);

  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedRef = useRef(false);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ gains, preset: activePreset, enabled: isEnabled }));
  }, [gains, activePreset, isEnabled]);

  // Setup/teardown audio graph
  const setupEQ = useCallback(() => {
    if (!audioRef.current) return;
    try {
      if (!contextRef.current) {
        contextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = contextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      if (!sourceRef.current) {
        sourceRef.current = ctx.createMediaElementSource(audioRef.current);
        connectedRef.current = false;
      }

      // Disconnect old filters
      filtersRef.current.forEach(f => { try { f.disconnect(); } catch {} });
      if (connectedRef.current) {
        try { sourceRef.current.disconnect(); } catch {}
      }

      if (!isEnabled) {
        // Bypass: connect source directly to destination
        sourceRef.current.connect(ctx.destination);
        connectedRef.current = true;
        filtersRef.current = [];
        return;
      }

      // Build filter chain
      const filters = BANDS.map((freq, i) => {
        const f = ctx.createBiquadFilter();
        f.type = i === 0 ? 'lowshelf' : i === BANDS.length - 1 ? 'highshelf' : 'peaking';
        f.frequency.value = freq;
        f.gain.value = gains[i];
        f.Q.value = 1.4;
        return f;
      });

      sourceRef.current.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) filters[i].connect(filters[i + 1]);
      filters[filters.length - 1].connect(ctx.destination);
      filtersRef.current = filters;
      connectedRef.current = true;
    } catch (e) {
      console.warn('EQ error:', e);
    }
  }, [isEnabled, gains, audioRef]);

  useEffect(() => { setupEQ(); }, [setupEQ]);

  const applyPreset = (name: string) => {
    setActivePreset(name);
    const newGains = [...(PRESETS[name] || new Array(10).fill(0))];
    setGains(newGains);
    // Update live filters
    filtersRef.current.forEach((f, i) => { if (f) f.gain.value = newGains[i]; });
  };

  const updateGain = (i: number, val: number) => {
    const next = [...gains];
    next[i] = val;
    setGains(next);
    setActivePreset('Custom');
    if (filtersRef.current[i]) filtersRef.current[i].gain.value = val;
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#181818] border border-white/[0.08] rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Sliders className="size-5 text-[#1db954]" />
            <h2 className="text-base font-bold text-white">Ecualizador</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6b7280]">{isEnabled ? 'Activo' : 'Inactivo'}</span>
              <button
                onClick={() => setIsEnabled(p => !p)}
                className={cn('w-9 h-5 rounded-full transition-colors relative', isEnabled ? 'bg-[#1db954]' : 'bg-white/20')}
              >
                <div className={cn('absolute top-0.5 size-4 bg-white rounded-full shadow transition-transform', isEnabled ? 'translate-x-4' : 'translate-x-0.5')} />
              </button>
            </div>
            <button onClick={onClose} className="size-7 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-white hover:bg-white/10 transition-colors">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(PRESETS).map(name => (
              <button
                key={name}
                onClick={() => applyPreset(name)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
                  activePreset === name ? 'bg-[#1db954] text-black' : 'bg-white/[0.07] text-[#b3b3b3] hover:bg-white/[0.12]'
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className={cn('px-5 py-5 transition-opacity', !isEnabled && 'opacity-40 pointer-events-none')}>
          <div className="flex items-end justify-between gap-1.5 h-36">
            {gains.map((gain, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <span className={cn('text-[9px] font-mono tabular-nums', gain > 0 ? 'text-[#1db954]' : gain < 0 ? 'text-red-400' : 'text-[#6b7280]')}>
                  {gain > 0 ? `+${gain}` : gain}
                </span>
                <input
                  type="range"
                  min={-12} max={12} step={1}
                  value={gain}
                  onChange={e => updateGain(i, Number(e.target.value))}
                  className="appearance-none cursor-pointer"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                    height: '80px',
                    width: '18px',
                    background: `linear-gradient(to top, #1db954 ${((gain + 12) / 24) * 100}%, rgba(255,255,255,0.1) ${((gain + 12) / 24) * 100}%)`,
                    borderRadius: '4px',
                    outline: 'none',
                  }}
                />
                <span className="text-[8px] text-[#6b7280] text-center leading-tight">{BAND_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-between">
          <p className="text-[11px] text-[#6b7280]">Configuración guardada automáticamente</p>
          <button
            onClick={() => applyPreset('Normal')}
            className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-white transition-colors"
          >
            <RotateCcw className="size-3" /> Restablecer
          </button>
        </div>
      </div>
    </div>
  );
}
