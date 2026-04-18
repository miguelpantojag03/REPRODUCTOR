'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'info' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t1 = setTimeout(() => setVisible(true), 10);
    // Trigger exit animation
    const t2 = setTimeout(() => setVisible(false), (toast.duration ?? 3000) - 300);
    // Remove after exit
    const t3 = setTimeout(() => onRemove(toast.id), toast.duration ?? 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [toast.id, toast.duration, onRemove]);

  const icons = {
    success: <CheckCircle2 className="size-4 shrink-0" />,
    info: <Info className="size-4 shrink-0" />,
    error: <AlertCircle className="size-4 shrink-0" />,
  };

  const styles = {
    success: 'bg-[#1db954] text-black',
    info: 'bg-[#282828] text-white border border-white/10',
    error: 'bg-red-600 text-white',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium',
        'transition-all duration-300 pointer-events-auto',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        styles[toast.type]
      )}
    >
      {icons[toast.type]}
      <span className="flex-1 whitespace-nowrap">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success', duration = 3000) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed z-[200] flex flex-col gap-2 pointer-events-none"
        style={{ bottom: 'calc(100px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', minWidth: '280px', maxWidth: '90vw' }}>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
