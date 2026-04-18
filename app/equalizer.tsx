'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlayback } from './playback-context';
import { Sliders, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const BANDS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
const BAND_LABELS = ['60', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'];

const PRESETS: Record<string, number[]> = {
  'Normal':     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Pop':        [1, 3, 4, 3, 1, -1, -1, 1, 2, 3],
  'Rock':       [4, 3, 2, 1, -1, -1, 1, 2, 3, 4],
  'Jazz':       [3, 2, 1, 2, -1, -1, 1, 2, 1, 2],
  'Clásica':    [3, 2, 0, 0, -1, -1, 0, 2, 3, 4],
  'Bass Boost': [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  'Vocal':      [-2, -1, 0, 2, 4, 4, 3, 2, 1, 0],
  'Electronic': [4, 3, 1, 0, -1, 2, 1, 2, 3, 4],
};

export function Equalizer({ onClose }: { onClose: () => void }) {
  const { audioRef } = usePlayback();
  const [gains, setGains] = useState<number[]>(new Array(10).fill(0));
  const [activePreset, setActivePreset] = useState('Normal');
  const [isEnabled, setIsEnabled] = useState(false);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioRef.current || !isEnabled) return;

    try {
      if (!contextRef.current) {
        contextRef.current = new AudioContext();
        sourceRef.current = contextRef.current.createMediaElementSource(audioRef.current);
      }

      const ctx = contextRef.current;
      // Disconnect existing filters
      filtersRef.current.forEach(f => { try { f.disconnect(); } catch {} });
      filtersRef.current = [];

      // Create filter chain
      const filters = BANDS.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? 'lowshelf' : i === BANDS.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = freq;
        filter.gain.value = gains[i];
        filter.Q.value = 1;
        return filter;
      });

      // Chain: source → f0 → f1 → ... → destination
      sourceRef.current!.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filters[filters.length - 1].connect(ctx.destination);
      filtersRef.current = filters;

      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {
      console.warn('EQ setup error:', e);
    }
  }, [isEnabled, gains]);

  const applyPreset = (name: string) => {
    setActivePreset(name);
    setGains([...PRESETS[name]]);
  };

  const updateGain = (index: number, value: number) => {
    const next = [...gains];
    next[index] = value;
    setGains(next);
    setActivePreset('Custom');
    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = value;
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Sliders className="size-5 text-[#1db954]" />
            <h2 className="text-lg font-bold text-white">Ecualizador</h2>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-gray-400">Activar</span>
              <div
                onClick={() => setIsEnabled(p => !p)}
                className={cn(
                  'w-10 h-5 rounded-full transition-colors relative cursor-pointer',
                  isEnabled ? 'bg-[#1db954]' : 'bg-white/20'
                )}
              >
                <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', isEnabled ? 'translate-x-5' : 'translate-x-0.5')} />
              </div>
            </label>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">×</button>
          </div>
        </div>

        {/* Presets */}
        <div className="px-6 py-3 border-b border-white/5">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(PRESETS).map(name => (
              <button
                key={name}
                onClick={() => applyPreset(name)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  activePreset === name ? 'bg-[#1db954] text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="px-6 py-6">
          <div className="flex items-end justify-between gap-2 h-40">
            {gains.map((gain, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[10px] text-[#1db954] font-mono tabular-nums">{gain > 0 ? `+${gain}` : gain}</span>
                <div className="relative flex-1 w-full flex items-center justify-center">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    onChange={e => updateGain(i, Number(e.target.value))}
                    disabled={!isEnabled}
                    className="eq-slider"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl', height: '100px', width: '20px', cursor: isEnabled ? 'pointer' : 'not-allowed', opacity: isEnabled ? 1 : 0.4 }}
                  />
                </div>
                <span className="text-[9px] text-gray-500">{BAND_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reset */}
        <div className="px-6 pb-4 flex justify-end">
          <button
            onClick={() => applyPreset('Normal')}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="size-3" /> Restablecer
          </button>
        </div>
      </div>
    </div>
  );
}
