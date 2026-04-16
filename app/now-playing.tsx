'use client';

import { useState, useRef, useEffect } from 'react';
import { useActionState } from 'react';
import { PencilIcon, Loader2, CheckIcon, MoreHorizontal } from 'lucide-react';
import { updateTrackAction, updateTrackImageAction } from './actions';
import { usePlayback } from './playback-context';
import { getValidImageUrl } from '@/lib/utils';
import { songs } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NowPlaying() {
  const { currentTrack, activePanel, setActivePanel } = usePlayback();
  const [imageState, imageFormAction, imagePending] = useActionState(
    updateTrackImageAction,
    {
      success: false,
      imageUrl: '',
    }
  );
  const [showPencil, setShowPencil] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!imagePending) {
      timer = setTimeout(() => {
        setShowPencil(true);
      }, 300);
    } else {
      setShowPencil(false);
    }
    return () => clearTimeout(timer);
  }, [imagePending]);

  if (!currentTrack) {
    return null;
  }

  const currentImageUrl = imageState?.success
    ? imageState.imageUrl
    : currentTrack.imageUrl;

  return (
    <div
      className={cn(
        'hidden xl:flex flex-col w-[320px] bg-[#121212] p-4 my-2 mr-2 rounded-lg transition-colors border-l border-transparent shadow-lg',
        activePanel === 'now-playing'
          ? 'bg-[#1a1a1a]'
          : 'opacity-100'
      )}
      onClick={() => setActivePanel('now-playing')}
    >
      <div className="flex items-center justify-between mb-4 mt-2 px-2">
        <h2 className="text-sm font-bold text-white hover:underline cursor-pointer truncate mr-2">
          {currentTrack.album || currentTrack.name}
        </h2>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#b3b3b3] hover:text-white rounded-full">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4 overflow-hidden">
        <div className="space-y-6 pb-20">
          <div className="relative aspect-square w-full rounded-md overflow-hidden bg-[#282828] shadow-[0_8px_24px_rgba(0,0,0,0.5)] group">
            <img
              src={getValidImageUrl(currentImageUrl)}
              alt="Album cover"
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
            <form action={imageFormAction} className="absolute inset-0">
              <input type="hidden" name="trackId" value={currentTrack.id} />
              <label
                htmlFor="imageUpload"
                className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity"
              >
                <input
                  id="imageUpload"
                  type="file"
                  name="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size <= 5 * 1024 * 1024) {
                        e.target.form?.requestSubmit();
                      } else {
                        alert('File size exceeds 5MB limit');
                        e.target.value = '';
                      }
                    }
                  }}
                />
                <div
                  className={cn(
                    'rounded-full p-2',
                    imagePending && 'bg-opacity-50'
                  )}
                >
                  {imagePending ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    showPencil && (
                      <PencilIcon className="w-6 h-6 text-white" />
                    )
                  )}
                </div>
              </label>
            </form>
          </div>
          <div className="w-full space-y-1">
            <EditableInput
              initialValue={currentTrack.name}
              trackId={currentTrack.id}
              field="name"
              label="Title"
            />
            <EditableInput
              initialValue={currentTrack.artist}
              trackId={currentTrack.id}
              field="artist"
              label="Artist"
            />
            <EditableInput
              initialValue={currentTrack.genre || ''}
              trackId={currentTrack.id}
              field="genre"
              label="Genre"
            />
            <EditableInput
              initialValue={currentTrack.album || ''}
              trackId={currentTrack.id}
              field="album"
              label="Album"
            />
            <EditableInput
              initialValue={currentTrack.bpm?.toString() || ''}
              trackId={currentTrack.id}
              field="bpm"
              label="BPM"
            />
            <EditableInput
              initialValue={currentTrack.key || ''}
              trackId={currentTrack.id}
              field="key"
              label="Key"
            />
          </div>
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
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setValue(initialValue);
    setIsEditing(false);
    setShowCheck(false);
  }, [initialValue, trackId]);

  useEffect(() => {
    if (state.success) {
      setShowCheck(true);
      const timer = setTimeout(() => {
        setShowCheck(false);
      }, 2000);
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(initialValue);
    }
  }

  return (
    <div className="space-y-1 group px-2">
      <label
        htmlFor={`${field}-input`}
        className="text-[11px] uppercase tracking-wider text-[#a7a7a7] font-bold"
      >
        {label}
      </label>
      <div className="flex items-center justify-between w-full text-sm h-6 border-b border-transparent focus-within:border-[#1db954] transition-colors">
        {isEditing ? (
          <form ref={formRef} action={formAction} className="w-full">
            <input type="hidden" name="trackId" value={trackId} />
            <input type="hidden" name="field" value={field} />
            <input
              ref={inputRef}
              id={`${field}-input`}
              type="text"
              name={field}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSubmit}
              className={cn(
                'bg-transparent w-full focus:outline-none p-0 text-white',
                state.error && 'text-red-500'
              )}
              aria-invalid={state.error ? 'true' : 'false'}
              aria-describedby={state.error ? `${field}-error` : undefined}
            />
          </form>
        ) : (
          <div
            className="w-full cursor-pointer truncate block"
            onClick={() => setIsEditing(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsEditing(true);
              }
            }}
            aria-label={`Edit ${label}`}
          >
            <span className={cn(value ? 'text-white' : 'text-[#a7a7a7]')}>
              {value || '-'}
            </span>
          </div>
        )}
        <div className="flex items-center">
          {pending ? (
            <Loader2 className="size-3 animate-spin text-[#1db954]" />
          ) : showCheck ? (
            <CheckIcon className="size-3 text-[#1db954]" />
          ) : (
            !isEditing && (
              <PencilIcon className="size-3 text-[#b3b3b3] opacity-0 group-hover:opacity-100 transition-opacity" />
            )
          )}
        </div>
      </div>
      {state.error && (
        <p id={`${field}-error`} className="text-xs text-red-500">
          {state.error}
        </p>
      )}
    </div>
  );
}
