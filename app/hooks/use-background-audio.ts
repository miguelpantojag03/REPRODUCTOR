'use client';

import { useEffect, useRef } from 'react';

/**
 * Registers the Service Worker and requests a Wake Lock
 * so audio keeps playing when the screen turns off on mobile.
 */
export function useBackgroundAudio(isPlaying: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Register Service Worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Registered:', reg.scope);
        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((err) => {
        // SW registration failed — not critical, audio still works
        console.warn('[SW] Registration failed:', err);
      });
  }, []);

  // Request Wake Lock when playing, release when paused
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('wakeLock' in navigator)) return;

    const requestWakeLock = async () => {
      try {
        // Release existing lock first
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
        if (isPlaying) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          wakeLockRef.current?.addEventListener('release', () => {
            wakeLockRef.current = null;
          });
        }
      } catch {
        // Wake Lock not available or denied — not critical
      }
    };

    requestWakeLock();

    // Re-acquire wake lock when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);
}
