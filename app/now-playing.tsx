'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
import { PencilIcon, Loader2, CheckIcon, ListMusic, Info, Trash2, GripVertical, Play, Timer, X, Mic2, Sliders } from 'lucide-react';
import { updateTrackAction, updateTrackImageAction } from './actions';
import { usePlayback } from './playback-context';
import { getValidImageUrl, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from './toast-provider';
import { songs } from '@/lib/db/schema';
import { LyricsPanel } from './lyrics-panel';
import { Equalizer } from './equalizer';
import Link from 'next/link';

type Tab = 'details' | 'queue' | 'lyrics';

// Sleep timer options in minutes (0 = off)
const SLEEP_OPTIONS = [0, 15, 30, 45, 60, 90];

export function NowPlaying() {
  const { currentTrack, activePanel, setActivePanel, playlist, reorderTrack, removeTrack, playTrack, isPlaying, togglePlayPause } = usePlayback();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null);
  const [showEQ, setShowEQ] = useState(false);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [imageState, imageFormAction, imagePending] = useActionState(
    updateTrackImageAction,
    { success: false, imageUrl: '' }
  );

  useEffect(() => {
    if (imageState?.success) toast('Carátula actualizada', 'success');
  }, [imageState, toast]);

  // Sleep timer logic
  useEffect(() => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    if (sleepMinutes === 0) {
      setSleepRemaining(null);
      return;
    }
    let remaining = sleepMinutes * 60;
    setSleepRemaining(remaining);
    sleepTimerRef.current = setInterval(() => {
      remaining -= 1;
      setSleepRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(sleepTimerRef.current!);
        setSleepMinutes(0);
        setSleepRemaining(null);
        if (isPlaying) togglePlayPause();
        toast('Temporizador de sueño activado', 'info');
      }
    }, 1000);
    return () => { if (sleepTimerRef.current) clearInterval(sleepTimerRef.current); };
  }, [sleepMinutes]);

  if (!currentTrack) return null;

  const currentImageUrl = imageState?.success ? imageState.imageUrl : currentTrack.imageUrl;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTrackId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedTrackId !== null) reorderTrack(draggedTrackId, targetIndex);
    setDragOverIndex(null);
    setDraggedTrackId(null);
  };

  const formatSleepTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'hidden lg:flex flex-col w-[320px] bg-[#121212] my-2 mr-2 rounded-lg transition-all duration-300 shadow-xl relative overflow-hidden group/panel',
        activePanel === 'now-playing' ? 'ring-1 ring-white/10 bg-[#181818]' : ''
      )}
      onClick={() => setActivePanel('now-playing')}
    >
      {/* Background Decor */}
      <div
        className="absolute inset-x-0 top-0 h-48 opacity-10 blur-2xl pointer-events-none"
        style={{ backgroundImage: `url(${getValidImageUrl(currentImageUrl)})`, backgroundSize: 'cover' }}
      />

      {/* Tabs Header */}
      <div className="flex items-center p-2 gap-1 border-b border-white/5 relative z-10 bg-[#121212]/80 backdrop-blur-md">
        <Button
          variant="ghost"
          size="sm"
          className={cn('flex-1 h-8 text-xs font-bold transition-all', activeTab === 'details' ? 'bg-white/10 text-white' : 'text-[#b3b3b3] hover:text-white')}
          onClick={() => setActiveTab('details')}
        >
          <Info className="size-3.5 mr-1.5" /> Info
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn('flex-1 h-8 text-xs font-bold transition-all', activeTab === 'lyrics' ? 'bg-white/10 text-white' : 'text-[#b3b3b3] hover:text-white')}
          onClick={() => setActiveTab('lyrics')}
        >
          <Mic2 className="size-3.5 mr-1.5" /> Letra
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn('flex-1 h-8 text-xs font-bold transition-all', activeTab === 'queue' ? 'bg-white/10 text-white' : 'text-[#b3b3b3] hover:text-white')}
          onClick={() => setActiveTab('queue')}
        >
          <ListMusic className="size-3.5 mr-1.5" /> Cola
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#b3b3b3] hover:text-white flex-shrink-0"
          onClick={() => setShowEQ(true)}
          title="Ecualizador"
        >
          <Sliders className="size-3.5" />
        </Button>
      </div>

      {showEQ && <Equalizer onClose={() => setShowEQ(false)} />}

      <ScrollArea className="flex-1 relative z-10">
        <div className="p-4">
          {activeTab === 'lyrics' ? (
            <LyricsPanel />
          ) : activeTab === 'details' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Cover art with upload */}
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#282828] shadow-2xl group">
                <img
                  src={getValidImageUrl(currentImageUrl)}
                  alt="Cover"
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                />
                <form action={imageFormAction} className="absolute inset-0">
                  <input type="hidden" name="trackId" value={currentTrack.id} />
                  <label
                    htmlFor="sideImageUpload"
                    className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity"
                  >
                    <input
                      id="sideImageUpload"
                      type="file"
                      name="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => e.target.form?.requestSubmit()}
                    />
                    {imagePending ? (
                      <Loader2 className="size-8 text-white animate-spin" />
                    ) : (
                      <PencilIcon className="size-8 text-white" />
                    )}
                  </label>
                </form>
                {/* Equalizer overlay when playing */}
                {isPlaying && (
                  <div className="absolute bottom-3 right-3 flex items-end gap-0.5 h-5 pointer-events-none">
                    <div className="w-1 bg-[#1db954] rounded-sm animate-now-playing-1" />
                    <div className="w-1 bg-[#1db954] rounded-sm animate-now-playing-2" />
                    <div className="w-1 bg-[#1db954] rounded-sm animate-now-playing-3" />
                    <div className="w-1 bg-[#1db954] rounded-sm animate-now-playing-1" />
                    <div className="w-1 bg-[#1db954] rounded-sm animate-now-playing-2" />
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white truncate">{currentTrack.name}</h3>
                <p className="text-sm text-[#b3b3b3] hover:text-white transition-colors cursor-pointer">{currentTrack.artist}</p>
                {(currentTrack as any).playCount > 0 && (
                  <p className="text-xs text-gray-600">{(currentTrack as any).playCount} reproducciones</p>
                )}
              </div>

              {/* Editable metadata */}
              <div className="space-y-4 pt-2">
                <EditableInput initialValue={currentTrack.genre || ''} trackId={currentTrack.id} field="genre" label="Género" />
                <EditableInput initialValue={currentTrack.album || ''} trackId={currentTrack.id} field="album" label="Álbum" />
                <EditableInput initialValue={currentTrack.bpm?.toString() || ''} trackId={currentTrack.id} field="bpm" label="BPM" />
                <EditableInput initialValue={currentTrack.key || ''} trackId={currentTrack.id} field="key" label="Tonalidad" />
              </div>

              {/* Sleep Timer */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Timer className="size-3.5 text-[#a7a7a7]" />
                    <span className="text-[10px] uppercase tracking-widest text-[#a7a7a7] font-bold">Temporizador</span>
                  </div>
                  {sleepRemaining !== null && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#1db954] tabular-nums font-mono">{formatSleepTime(sleepRemaining)}</span>
                      <button onClick={() => setSleepMinutes(0)} className="text-gray-500 hover:text-white transition-colors">
                        <X className="size-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SLEEP_OPTIONS.filter(m => m > 0).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSleepMinutes(sleepMinutes === m ? 0 : m)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                        sleepMinutes === m ? 'bg-[#1db954] text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      )}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-300">
              <h4 className="text-[11px] uppercase tracking-widest text-[#a7a7a7] font-bold mb-3">En reproducción</h4>
              <div className="flex items-center gap-3 p-2 rounded-md bg-white/5 mb-6 group/active border border-white/5">
                <div className="size-10 relative flex-shrink-0 rounded overflow-hidden">
                  <img src={getValidImageUrl(currentTrack.imageUrl)} className="object-cover w-full h-full" alt="" />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="flex items-end gap-0.5 h-3">
                        <div className="w-0.5 bg-green-500 animate-now-playing-1" />
                        <div className="w-0.5 bg-green-500 animate-now-playing-2" />
                        <div className="w-0.5 bg-green-500 animate-now-playing-3" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-green-500 truncate">{currentTrack.name}</div>
                  <div className="text-xs text-[#b3b3b3] truncate">{currentTrack.artist}</div>
                </div>
              </div>

              <h4 className="text-[11px] uppercase tracking-widest text-[#a7a7a7] font-bold mb-3 mt-6">Siguientes</h4>
              {playlist.map((track, index) => {
                if (track.id === currentTrack.id) return null;
                return (
                  <div
                    key={`${track.id}-${index}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, track.id)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={cn(
                      'group flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-all relative cursor-default border border-transparent',
                      dragOverIndex === index && 'border-t-green-500 bg-green-500/5'
                    )}
                  >
                    <GripVertical className="size-3.5 text-[#a7a7a7] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex-shrink-0" />
                    <div className="size-10 relative flex-shrink-0 bg-[#282828] rounded overflow-hidden">
                      <img src={getValidImageUrl(track.imageUrl)} className="object-cover w-full h-full" alt="" />
                      <button
                        onClick={() => playTrack(track)}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="size-4 text-white fill-white" />
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white truncate">{track.name}</div>
                      <div className="text-xs text-[#b3b3b3] truncate">{track.artist}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}
                      className="opacity-0 group-hover:opacity-100 size-8 flex items-center justify-center text-[#b3b3b3] hover:text-red-500 transition-all rounded-full hover:bg-white/5 flex-shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
              {playlist.length <= 1 && (
                <p className="text-center py-10 text-xs text-[#a7a7a7] italic">
                  La cola está vacía. Busca canciones y añádelas con el botón +
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface EditableInputProps {
  initialValue: string;
  trackId: string;
  field: keyof typeof songs.$inferInsert;
  label: string;
}

export function EditableInput({
  initialValue,
  trackId,
  field,
  label,
}: EditableInputProps) {
  let [isEditing, setIsEditing] = useState(false);
  let [value, setValue] = useState(initialValue);
  let [showCheck, setShowCheck] = useState(false);
  let inputRef = useRef<HTMLInputElement>(null);
  let formRef = useRef<HTMLFormElement>(null);
  let [state, formAction, pending] = useActionState(updateTrackAction, {
    success: false,
    error: '',
  });

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
    setValue(initialValue);
    setIsEditing(false);
    setShowCheck(false);
  }, [initialValue, trackId]);

  useEffect(() => {
    if (state.success) {
      setShowCheck(true);
      const timer = setTimeout(() => setShowCheck(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  function handleSubmit() {
    if (value.trim() === '' || value === initialValue) {
      setIsEditing(false);
      return;
    }
    formRef.current?.requestSubmit();
    setIsEditing(false);
  }

  return (
    <div className="space-y-1 group">
      <label className="text-[10px] uppercase tracking-widest text-[#a7a7a7] font-bold">{label}</label>
      <div className="flex items-center justify-between h-7 border-b border-transparent focus-within:border-green-500 transition-all">
        {isEditing ? (
          <form ref={formRef} action={formAction} className="w-full">
            <input type="hidden" name="trackId" value={trackId} />
            <input type="hidden" name="field" value={field} />
            <input
              ref={inputRef}
              type="text"
              name={field}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } if (e.key === 'Escape') { setIsEditing(false); setValue(initialValue); } }}
              className="bg-transparent w-full focus:outline-none text-sm text-white p-0"
            />
          </form>
        ) : (
          <div className="w-full cursor-text truncate text-sm" onClick={() => setIsEditing(true)}>
            <span className={cn(value ? 'text-white' : 'text-[#a7a7a7]/50')}>{value || 'Añadir...'}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {pending ? <Loader2 className="size-3 animate-spin text-green-500" /> : showCheck ? <CheckIcon className="size-3 text-green-500" /> : <PencilIcon className="size-3 text-[#b3b3b3] opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      </div>
    </div>
  );
}
