'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
import {
  PencilIcon, Loader2, CheckIcon, ListMusic, Info,
  Trash2, GripVertical, Play, Timer, X, Mic2, Sliders,
} from 'lucide-react';
import { updateTrackAction, updateTrackImageAction } from './actions';
import { usePlayback } from './playback-context';
import { getValidImageUrl, cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from './toast-provider';
import { songs } from '@/lib/db/schema';
import { LyricsPanel } from './lyrics-panel';
import { Equalizer } from './equalizer';
import Link from 'next/link';

type Tab = 'details' | 'lyrics' | 'queue';
const SLEEP_OPTS = [15, 30, 45, 60, 90];

export function NowPlaying() {
  const {
    currentTrack, activePanel, setActivePanel,
    playlist, reorderTrack, removeTrack, playTrack, isPlaying, togglePlayPause,
  } = usePlayback();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('details');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [sleepMin, setSleepMin] = useState(0);
  const [sleepLeft, setSleepLeft] = useState<number | null>(null);
  const [showEQ, setShowEQ] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [imgState, imgAction, imgPending] = useActionState(updateTrackImageAction, { success: false, imageUrl: '' });
  useEffect(() => { if (imgState?.success) toast('Carátula actualizada', 'success'); }, [imgState]);

  // Sleep timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!sleepMin) { setSleepLeft(null); return; }
    let rem = sleepMin * 60;
    setSleepLeft(rem);
    timerRef.current = setInterval(() => {
      rem--;
      setSleepLeft(rem);
      if (rem <= 0) {
        clearInterval(timerRef.current!);
        setSleepMin(0);
        setSleepLeft(null);
        if (isPlaying) togglePlayPause();
        toast('Música pausada por el temporizador', 'info');
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sleepMin]);

  if (!currentTrack) return null;

  const imgUrl = imgState?.success ? imgState.imageUrl : currentTrack.imageUrl;
  const fmtSleep = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'details', label: 'Info', icon: Info },
    { id: 'lyrics', label: 'Letra', icon: Mic2 },
    { id: 'queue', label: 'Cola', icon: ListMusic },
  ];

  return (
    <div
      className={cn(
        'hidden lg:flex flex-col w-[300px] bg-[#121212] my-2 mr-2 rounded-xl shadow-2xl relative overflow-hidden transition-all duration-200',
        activePanel === 'now-playing' ? 'ring-1 ring-white/10' : ''
      )}
      onClick={() => setActivePanel('now-playing')}
    >
      {/* Blurred bg from cover */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: `url(${getValidImageUrl(imgUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px)', transform: 'scale(1.2)' }}
      />

      {/* Tab bar */}
      <div className="relative z-10 flex items-center gap-1 p-2 border-b border-white/[0.06]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-all duration-150',
              tab === id ? 'bg-white/10 text-white' : 'text-[#6b7280] hover:text-[#b3b3b3] hover:bg-white/[0.04]'
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
        <button
          onClick={() => setShowEQ(true)}
          className="size-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors flex-shrink-0"
          title="Ecualizador"
        >
          <Sliders className="size-3.5" />
        </button>
      </div>

      {showEQ && <Equalizer onClose={() => setShowEQ(false)} />}

      <ScrollArea className="flex-1 relative z-10">
        {/* ── DETAILS ── */}
        {tab === 'details' && (
          <div className="p-4 space-y-5">
            {/* Cover */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#282828] shadow-2xl group">
              {isPlaying && (
                <div className="absolute inset-0 rounded-xl ring-2 ring-[#1db954]/40 pointer-events-none z-10 animate-glow-pulse" />
              )}
              <img
                src={getValidImageUrl(imgUrl)}
                alt="Cover"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <form action={imgAction} className="absolute inset-0 z-20">
                <input type="hidden" name="trackId" value={currentTrack.id} />
                <label htmlFor="coverUpload" className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity rounded-xl">
                  <input id="coverUpload" type="file" name="file" className="hidden" accept="image/*" onChange={e => e.target.form?.requestSubmit()} />
                  {imgPending ? <Loader2 className="size-7 text-white animate-spin" /> : <PencilIcon className="size-7 text-white" />}
                </label>
              </form>
              {isPlaying && (
                <div className="absolute bottom-3 right-3 flex items-end gap-0.5 h-5 pointer-events-none z-10">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-1 bg-[#1db954] rounded-sm wave-bar-${i <= 3 ? i : i - 2}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Track info */}
            <div>
              <h3 className="text-lg font-bold text-white truncate leading-tight">{currentTrack.name}</h3>
              <Link
                href={`/artist/${encodeURIComponent(currentTrack.artist)}`}
                className="text-sm text-[#b3b3b3] hover:text-white transition-colors hover:underline mt-0.5 block"
              >
                {currentTrack.artist}
              </Link>
              {(currentTrack as any).playCount > 0 && (
                <p className="text-xs text-[#6b7280] mt-1">{(currentTrack as any).playCount} reproducciones</p>
              )}
            </div>

            {/* Metadata */}
            <div className="space-y-3 pt-1 border-t border-white/[0.06]">
              <EditableField value={currentTrack.genre || ''} trackId={currentTrack.id} field="genre" label="Género" />
              <EditableField value={currentTrack.album || ''} trackId={currentTrack.id} field="album" label="Álbum" />
              <EditableField value={currentTrack.bpm?.toString() || ''} trackId={currentTrack.id} field="bpm" label="BPM" />
              <EditableField value={currentTrack.key || ''} trackId={currentTrack.id} field="key" label="Tonalidad" />
            </div>

            {/* Sleep timer */}
            <div className="pt-1 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Timer className="size-3.5 text-[#6b7280]" />
                  <span className="text-[11px] uppercase tracking-widest text-[#6b7280] font-bold">Temporizador</span>
                </div>
                {sleepLeft !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#1db954] tabular-nums font-mono font-bold">{fmtSleep(sleepLeft)}</span>
                    <button onClick={() => setSleepMin(0)} className="text-[#6b7280] hover:text-white transition-colors">
                      <X className="size-3" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SLEEP_OPTS.map(m => (
                  <button
                    key={m}
                    onClick={() => setSleepMin(sleepMin === m ? 0 : m)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150',
                      sleepMin === m ? 'bg-[#1db954] text-black' : 'bg-white/[0.07] text-[#b3b3b3] hover:bg-white/[0.12]'
                    )}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LYRICS ── */}
        {tab === 'lyrics' && <LyricsPanel />}

        {/* ── QUEUE ── */}
        {tab === 'queue' && (
          <div className="p-3 space-y-1">
            {/* Current */}
            <p className="text-[10px] uppercase tracking-widest text-[#6b7280] font-bold px-2 mb-2">Reproduciendo</p>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] mb-4">
              <div className="size-10 rounded-lg overflow-hidden flex-shrink-0 relative">
                <img src={getValidImageUrl(currentTrack.imageUrl)} className="w-full h-full object-cover" alt="" />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-end gap-[2px] h-3">
                      <div className="w-[2px] bg-[#1db954] rounded-sm wave-bar-1" />
                      <div className="w-[2px] bg-[#1db954] rounded-sm wave-bar-2" />
                      <div className="w-[2px] bg-[#1db954] rounded-sm wave-bar-3" />
                    </div>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1db954] truncate">{currentTrack.name}</p>
                <p className="text-xs text-[#6b7280] truncate">{currentTrack.artist}</p>
              </div>
            </div>

            {/* Next up */}
            {playlist.filter(t => t.id !== currentTrack.id).length > 0 && (
              <p className="text-[10px] uppercase tracking-widest text-[#6b7280] font-bold px-2 mb-2">Siguientes</p>
            )}
            {playlist.map((track, i) => {
              if (track.id === currentTrack.id) return null;
              return (
                <div
                  key={`${track.id}-${i}`}
                  draggable
                  onDragStart={e => { setDragId(track.id); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => { e.preventDefault(); if (dragId) reorderTrack(dragId, i); setDragOver(null); setDragId(null); }}
                  className={cn(
                    'group flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-default border border-transparent',
                    'hover:bg-white/[0.05]',
                    dragOver === i && 'border-t-[#1db954] bg-[#1db954]/5'
                  )}
                >
                  <GripVertical className="size-3.5 text-[#6b7280] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" />
                  <div className="size-9 rounded-lg overflow-hidden flex-shrink-0 bg-[#282828] relative">
                    <img src={getValidImageUrl(track.imageUrl)} className="w-full h-full object-cover" alt="" />
                    <button
                      onClick={() => playTrack(track)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="size-3.5 text-white fill-white" />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{track.name}</p>
                    <p className="text-[11px] text-[#6b7280] truncate">{track.artist}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); removeTrack(track.id); }}
                    className="opacity-0 group-hover:opacity-100 size-7 flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-all rounded-lg hover:bg-white/[0.06] flex-shrink-0"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
            {playlist.length <= 1 && (
              <p className="text-center py-12 text-xs text-[#6b7280] italic">
                La cola está vacía
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

/* ── Editable Field ─────────────────────────────────────────── */
function EditableField({
  value: initialValue, trackId, field, label,
}: {
  value: string; trackId: string; field: keyof typeof songs.$inferInsert; label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(initialValue);
  const [ok, setOk] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(updateTrackAction, { success: false, error: '' });

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { setVal(initialValue); setEditing(false); setOk(false); }, [initialValue, trackId]);
  useEffect(() => {
    if (state.success) { setOk(true); setTimeout(() => setOk(false), 2000); }
  }, [state.success]);

  const submit = () => {
    if (!val.trim() || val === initialValue) { setEditing(false); return; }
    formRef.current?.requestSubmit();
    setEditing(false);
  };

  return (
    <div className="group">
      <p className="text-[10px] uppercase tracking-widest text-[#6b7280] font-bold mb-1">{label}</p>
      <div className={cn('flex items-center justify-between h-7 border-b transition-colors', editing ? 'border-[#1db954]' : 'border-white/[0.06] hover:border-white/20')}>
        {editing ? (
          <form ref={formRef} action={action} className="flex-1">
            <input type="hidden" name="trackId" value={trackId} />
            <input type="hidden" name="field" value={field} />
            <input
              ref={inputRef}
              type="text"
              name={field}
              value={val}
              onChange={e => setVal(e.target.value)}
              onBlur={submit}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } if (e.key === 'Escape') { setEditing(false); setVal(initialValue); } }}
              className="bg-transparent w-full text-sm text-white focus:outline-none"
            />
          </form>
        ) : (
          <span
            className={cn('text-sm truncate cursor-text flex-1', val ? 'text-white' : 'text-[#6b7280]/50')}
            onClick={() => setEditing(true)}
          >
            {val || 'Añadir...'}
          </span>
        )}
        <div className="ml-2 flex-shrink-0">
          {pending ? <Loader2 className="size-3 animate-spin text-[#1db954]" />
            : ok ? <CheckIcon className="size-3 text-[#1db954]" />
            : <PencilIcon className="size-3 text-[#6b7280] opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      </div>
    </div>
  );
}

// Keep old export name for backward compat
export { EditableField as EditableInput };
