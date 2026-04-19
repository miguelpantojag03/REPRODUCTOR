'use server';

import { createPlaylist } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { playlists, playlistSongs, songs } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { put } from '@vercel/blob';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

/* ── Helpers ─────────────────────────────────────────────────── */
function isLocalEnv() {
  return (
    !process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.BLOB_READ_WRITE_TOKEN.startsWith('placeholder') ||
    process.env.BLOB_READ_WRITE_TOKEN === ''
  );
}

async function ensureDir(dir: string) {
  if (!existsSync(dir)) await fs.mkdir(dir, { recursive: true });
}

async function saveFileLocally(buffer: Buffer, folder: string, fileName: string): Promise<string> {
  const safe = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const publicPath = path.join(process.cwd(), 'public', folder);
  await ensureDir(publicPath);
  await fs.writeFile(path.join(publicPath, safe), buffer);
  return `/${folder}/${safe}`;
}

async function uploadFile(buffer: Buffer, remotePath: string, mimeType = 'application/octet-stream'): Promise<string> {
  if (isLocalEnv()) {
    const parts = remotePath.split('/');
    const folder = parts[0];
    const fileName = parts.slice(1).join('/') || parts[0];
    return saveFileLocally(buffer, folder, fileName);
  }
  const { url } = await put(remotePath, buffer, { access: 'public', contentType: mimeType });
  return url;
}

function invalidateAll() {
  revalidatePath('/', 'layout');
  revalidatePath('/', 'layout');
}

/* ── Playlist Actions ────────────────────────────────────────── */
export async function createPlaylistAction(id: string, name: string) {
  if (!id || !name?.trim()) return;
  await createPlaylist(id, name.trim());
}

export async function updatePlaylistNameAction(playlistId: string, name: string) {
  if (!playlistId || !name?.trim()) return;
  await db.update(playlists)
    .set({ name: name.trim(), updatedAt: new Date() })
    .where(eq(playlists.id, playlistId));
  revalidatePath('/', 'layout');
}

export async function deletePlaylistAction(id: string) {
  if (!id) return;
  await db.transaction(async (tx) => {
    await tx.delete(playlistSongs).where(eq(playlistSongs.playlistId, id));
    await tx.delete(playlists).where(eq(playlists.id, id));
  });
  revalidatePath('/', 'layout');
}

export async function uploadPlaylistCoverAction(_: any, formData: FormData) {
  const playlistId = formData.get('playlistId') as string;
  const file = formData.get('file') as File;
  if (!playlistId || !file?.size) {
    return { success: false, error: 'Datos inválidos' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const coverUrl = await uploadFile(
      buffer,
      `covers/${playlistId}-${Date.now()}.${ext}`,
      file.type || 'image/jpeg'
    );
    await db.update(playlists).set({ coverUrl }).where(eq(playlists.id, playlistId));
    revalidatePath('/', 'layout');
    return { success: true, coverUrl };
  } catch (error) {
    console.error('[uploadPlaylistCoverAction]', error);
    return { success: false, error: 'Error al subir la imagen' };
  }
}

export async function addToPlaylistAction(playlistId: string, songId: string) {
  if (!playlistId || !songId) return { success: false, message: 'Datos inválidos' };

  const existing = await db
    .select({ id: playlistSongs.id })
    .from(playlistSongs)
    .where(and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId)))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, message: 'La canción ya está en la lista' };
  }

  const [maxResult] = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${playlistSongs.order}), 0)` })
    .from(playlistSongs)
    .where(eq(playlistSongs.playlistId, playlistId));

  await db.insert(playlistSongs).values({
    playlistId,
    songId,
    order: (maxResult?.maxOrder ?? 0) + 1,
  });

  revalidatePath('/', 'layout');
  return { success: true, message: 'Canción añadida con éxito' };
}

export async function removeFromPlaylistAction(playlistId: string, songId: string) {
  if (!playlistId || !songId) return { success: false };
  await db.delete(playlistSongs)
    .where(and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId)));
  revalidatePath('/', 'layout');
  return { success: true };
}

/* ── Track Actions ───────────────────────────────────────────── */
export async function updateTrackAction(_: any, formData: FormData) {
  const trackId = formData.get('trackId') as string;
  const field   = formData.get('field')   as string;

  if (!trackId || !field) return { success: false, error: 'Datos inválidos' };

  // Whitelist allowed fields
  const ALLOWED_FIELDS = ['name', 'artist', 'album', 'genre', 'bpm', 'key'] as const;
  if (!ALLOWED_FIELDS.includes(field as any)) {
    return { success: false, error: 'Campo no permitido' };
  }

  let value: any = formData.get(field);

  // Type coercion
  if (field === 'bpm') {
    value = value ? parseInt(String(value), 10) : null;
    if (value !== null && (isNaN(value) || value < 0 || value > 999)) {
      return { success: false, error: 'BPM inválido' };
    }
  } else if (typeof value === 'string') {
    value = value.trim() || null; // Empty string → null
  }

  await db.update(songs).set({ [field]: value, updatedAt: new Date() }).where(eq(songs.id, trackId));
  revalidatePath('/', 'layout');
  return { success: true, error: '' };
}

export async function updateTrackImageAction(_: any, formData: FormData) {
  const trackId = formData.get('trackId') as string;
  const file    = formData.get('file')    as File;
  if (!trackId || !file?.size) return { success: false, imageUrl: '' };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const imageUrl = await uploadFile(
      buffer,
      `covers/${trackId}-${Date.now()}.${ext}`,
      file.type || 'image/jpeg'
    );
    await db.update(songs).set({ imageUrl, updatedAt: new Date() }).where(eq(songs.id, trackId));
    revalidatePath('/', 'layout');
    return { success: true, imageUrl };
  } catch (error) {
    console.error('[updateTrackImageAction]', error);
    return { success: false, imageUrl: '' };
  }
}

export async function toggleFavoriteAction(trackId: string, isFavorite: boolean) {
  if (!trackId) return { success: false };
  try {
    await db.update(songs)
      .set({ favorite: isFavorite, updatedAt: new Date() })
      .where(eq(songs.id, trackId));
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('[toggleFavoriteAction]', error);
    return { success: false };
  }
}

export async function deleteSongAction(trackId: string) {
  if (!trackId) return { success: false, error: 'ID inválido' };
  try {
    await db.transaction(async (tx) => {
      await tx.delete(playlistSongs).where(eq(playlistSongs.songId, trackId));
      await tx.delete(songs).where(eq(songs.id, trackId));
    });
    invalidateAll();
    return { success: true };
  } catch (error) {
    console.error('[deleteSongAction]', error);
    return { success: false, error: 'Error al eliminar la canción' };
  }
}

export async function incrementPlayCountAction(trackId: string) {
  if (!trackId) return { success: false };
  try {
    await db.update(songs)
      .set({
        playCount:   sql`${songs.playCount} + 1`,
        lastPlayedAt: new Date(),
        updatedAt:   new Date(),
      })
      .where(eq(songs.id, trackId));
    // Don't revalidate on every play — too expensive
    // The cache will expire naturally (revalidate: 10s on recently-played)
    return { success: true };
  } catch {
    return { success: false };
  }
}

/* ── Online Search ───────────────────────────────────────────── */
export async function searchOnlineTracksAction(query: string) {
  if (!query?.trim()) return [];
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=50&media=music`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // Cache 5 min
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || [])
      .filter((item: any) => item.previewUrl) // Only tracks with audio
      .map((item: any) => ({
        id:       `itunes-${item.trackId}`,
        name:     item.trackName,
        artist:   item.artistName,
        album:    item.collectionName,
        duration: Math.round((item.trackTimeMillis || 0) / 1000),
        imageUrl: item.artworkUrl100?.replace('100x100', '600x600') || null,
        audioUrl: item.previewUrl,
        genre:    item.primaryGenreName || null,
        isLocal:  false,
        isYouTube: true,
      }));
  } catch (error) {
    console.error('[searchOnlineTracksAction]', error);
    return [];
  }
}

export async function searchOnlineAlbumsAction(query: string) {
  if (!query?.trim()) return [];
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=12&media=music`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((item: any) => ({
      id:         `itunes-album-${item.collectionId}`,
      name:       item.collectionName,
      artist:     item.artistName,
      imageUrl:   item.artworkUrl100?.replace('100x100', '600x600') || null,
      genre:      item.primaryGenreName || null,
      trackCount: item.trackCount || 0,
      year:       item.releaseDate ? new Date(item.releaseDate).getFullYear() : null,
    }));
  } catch {
    return [];
  }
}

export async function saveOnlineTrackAction(track: any) {
  if (!track?.id || !track?.name || !track?.audioUrl) {
    return { success: false, error: 'Datos de canción inválidos' };
  }

  try {
    // Check if already saved
    const existing = await db.select({ id: songs.id })
      .from(songs)
      .where(eq(songs.id, track.id))
      .limit(1);

    if (existing.length > 0) {
      return { success: true, songId: existing[0].id };
    }

    const [newSong] = await db.insert(songs).values({
      id:       track.id,
      name:     track.name,
      artist:   track.artist || 'Artista Desconocido',
      album:    track.album  || null,
      duration: track.duration || 0,
      genre:    track.genre  || null,
      imageUrl: track.imageUrl || null,
      audioUrl: track.audioUrl,
      isLocal:  false,
      favorite: false,
    }).returning();

    revalidatePath('/', 'layout');
    return { success: true, song: newSong, songId: newSong.id };
  } catch (error) {
    console.error('[saveOnlineTrackAction]', error);
    return { success: false, error: 'Error al guardar la canción' };
  }
}

/* ── YouTube ─────────────────────────────────────────────────── */
export async function getYouTubeIdAction(trackName: string, artistName: string) {
  try {
    const query = `${trackName} ${artistName} official audio`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    if (!res.ok) return { success: false, error: 'YouTube unavailable' };

    const html = await res.text();

    // Try multiple patterns to extract video ID
    const patterns = [
      /"videoId":"([a-zA-Z0-9_-]{11})"/,
      /watch\?v=([a-zA-Z0-9_-]{11})/,
      /"url":"\/watch\?v=([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        return { success: true, videoId: match[1] };
      }
    }

    return { success: false, error: 'No video found' };
  } catch (error) {
    console.error('[getYouTubeIdAction]', error);
    return { success: false, error: 'Failed to search YouTube' };
  }
}
