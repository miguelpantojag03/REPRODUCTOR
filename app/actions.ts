'use server';

import { createPlaylist } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { playlists, playlistSongs, songs } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { put } from '@vercel/blob';
import { parseBuffer } from 'music-metadata';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export async function createPlaylistAction(id: string, name: string) {
  // Let's only handle this on local for now
  if (process.env.VERCEL_ENV === 'production') {
    return;
  }

  await createPlaylist(id, name);
}

export async function uploadPlaylistCoverAction(_: any, formData: FormData) {
  // Let's only handle this on local for now
  if (process.env.VERCEL_ENV === 'production') {
    return;
  }

  const playlistId = formData.get('playlistId') as string;
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const blob = await put(`playlist-covers/${playlistId}-${file.name}`, file, {
      access: 'public',
    });

    await db
      .update(playlists)
      .set({ coverUrl: blob.url })
      .where(eq(playlists.id, playlistId));

    revalidatePath(`/p/${playlistId}`);

    return { success: true, coverUrl: blob.url };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

export async function updatePlaylistNameAction(
  playlistId: string,
  name: string
) {
  // Let's only handle this on local for now
  if (process.env.VERCEL_ENV === 'production') {
    return;
  }

  await db.update(playlists).set({ name }).where(eq(playlists.id, playlistId));

  revalidatePath('/', 'layout');
}

export async function deletePlaylistAction(id: string) {
  // Let's only handle this on local for now
  if (process.env.VERCEL_ENV === 'production') {
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(playlistSongs)
      .where(eq(playlistSongs.playlistId, id))
      .execute();

    await tx.delete(playlists).where(eq(playlists.id, id)).execute();
  });
}

export async function addToPlaylistAction(playlistId: string, songId: string) {
  // Check if the song is already in the playlist
  const existingEntry = await db
    .select()
    .from(playlistSongs)
    .where(
      and(
        eq(playlistSongs.playlistId, playlistId),
        eq(playlistSongs.songId, songId)
      )
    )
    .execute();

  if (existingEntry.length > 0) {
    return { success: false, message: 'Song is already in the playlist' };
  }

  // Get the current maximum order for the playlist
  const maxOrderResult = await db
    .select({ maxOrder: sql<number>`MAX(${playlistSongs.order})` })
    .from(playlistSongs)
    .where(eq(playlistSongs.playlistId, playlistId))
    .execute();

  const newOrder = (maxOrderResult[0]?.maxOrder ?? 0) + 1;

  await db
    .insert(playlistSongs)
    .values({
      playlistId,
      songId,
      order: newOrder,
    })
    .execute();

  revalidatePath('/', 'layout');

  return { success: true, message: 'Song added to playlist successfully' };
}

export async function updateTrackAction(_: any, formData: FormData) {
  let trackId = formData.get('trackId') as string;
  let field = formData.get('field') as string;
  let value = formData.get(field) as keyof typeof songs.$inferInsert | number;

  if (value === 'bpm' && typeof value === 'number') {
    value = parseInt(value as string);
  } else {
    return { success: false, error: 'bpm should be a valid number' };
  }

  let data: Partial<typeof songs.$inferInsert> = { [field]: value };
  await db.update(songs).set(data).where(eq(songs.id, trackId));
  revalidatePath('/', 'layout');

  return { success: true, error: '' };
}

export async function updateTrackImageAction(_: any, formData: FormData) {
  let trackId = formData.get('trackId') as string;
  let file = formData.get('file') as File;

  if (!trackId || !file) {
    throw new Error('Missing trackId or file');
  }

  try {
    const blob = await put(`track-images/${trackId}-${file.name}`, file, {
      access: 'public',
    });

    await db
      .update(songs)
      .set({ imageUrl: blob.url })
      .where(eq(songs.id, trackId));

    revalidatePath('/', 'layout');

    return { success: true, imageUrl: blob.url };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}
async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function saveFileLocally(
  buffer: Buffer,
  folder: string,
  fileName: string
) {
  const publicPath = path.join(process.cwd(), 'public', folder);
  await ensureDir(publicPath);
  const filePath = path.join(publicPath, fileName);
  await fs.writeFile(filePath, buffer);
  return `/${folder}/${fileName}`;
}

export type UploadState = {
  success: boolean;
  message?: string;
  error?: string;
  song?: typeof songs.$inferSelect;
};

export async function uploadSongAction(
  prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const file = formData.get('file') as File;

  if (!file) {
    return { success: false, error: 'No se proporcionó ningún archivo.' };
  }

  // Permition check - local dev only for this workshop
  if (process.env.VERCEL_ENV === 'production') {
    return {
      success: false,
      message: '',
      error: 'Carga deshabilitada en producción.',
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Extraer Metadatos
    const metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });

    const isLocalFallback =
      !process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_READ_WRITE_TOKEN.startsWith('placeholder');

    let imageUrl: string | null = null;

    // 2. Manejar Carátula si existe
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0];
      const imageBuffer = Buffer.from(picture.data);
      const imgName = `${file.name}-${Date.now()}.${picture.format}`;

      if (isLocalFallback) {
        imageUrl = await saveFileLocally(imageBuffer, 'album_covers', imgName);
      } else {
        const { url } = await put(`album_covers/${imgName}`, imageBuffer, {
          access: 'public',
        });
        imageUrl = url;
      }
    }

    // 3. Subir Audio
    let audioUrl: string;
    if (isLocalFallback) {
      audioUrl = await saveFileLocally(buffer, 'audio', file.name);
    } else {
      const { url } = await put(`audio/${file.name}`, buffer, {
        access: 'public',
      });
      audioUrl = url;
    }

    // 4. Guardar en Base de Datos
    const songData = {
      name: metadata.common.title || path.parse(file.name).name,
      artist: metadata.common.artist || 'Artista Desconocido',
      album: metadata.common.album || 'Álbum Desconocido',
      duration: Math.round(metadata.format.duration || 0),
      genre: metadata.common.genre?.[0] || 'Género Desconocido',
      bpm: metadata.common.bpm ? Math.round(metadata.common.bpm) : null,
      key: metadata.common.key || null,
      imageUrl,
      audioUrl,
      isLocal: false,
    };

    const [newSong] = await db.insert(songs).values(songData).returning();

    revalidatePath('/', 'layout');

    // Convert to plain object to avoid serialization issues with Dates
    const serializableSong = JSON.parse(JSON.stringify(newSong));

    return {
      success: true,
      message: `Canción "${songData.name}" subida exitosamente.`,
      song: serializableSong,
    };
  } catch (error) {
    console.error('Error al subir canción:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return {
      success: false,
      message: '',
      error: error instanceof Error && error.message.includes('token')
          ? 'Error de Acceso: Por favor configura un BLOB_READ_WRITE_TOKEN válido en tu archivo .env.'
          : `Error: ${errorMessage}`,
    };
  }
}
export async function searchOnlineTracksAction(query: string) {
  if (!query) return [];

  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`
    );
    const data = await response.json();

    return data.results.map((item: any) => ({
      id: `itunes-${item.trackId}`,
      name: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      duration: Math.round(item.trackTimeMillis / 1000),
      imageUrl: item.artworkUrl100.replace('100x100', '600x600'),
      audioUrl: item.previewUrl,
      genre: item.primaryGenreName,
      isLocal: false,
    }));
  } catch (error) {
    console.error('Error fetching from iTunes:', error);
    return [];
  }
}

export async function saveOnlineTrackAction(track: any) {
  try {
    const existing = await db
      .select()
      .from(songs)
      .where(eq(songs.id, track.id))
      .limit(1);

    if (existing.length > 0) return { success: true, song: existing[0] };

    const [newSong] = await db
      .insert(songs)
      .values({
        id: track.id,
        name: track.name,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        genre: track.genre,
        imageUrl: track.imageUrl,
        audioUrl: track.audioUrl,
        isLocal: false,
      })
      .returning();

    revalidatePath('/', 'layout');
    return { success: true, song: newSong };
  } catch (error) {
    console.error('Error saving online track:', error);
    return { success: false, error: 'Failed to save track' };
  }
}
