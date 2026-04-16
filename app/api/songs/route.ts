import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { songs } from '@/lib/db/schema';
import { getAllSongs } from '@/lib/db/queries';
import { put } from '@vercel/blob';
import { parseBuffer } from 'music-metadata';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { revalidatePath } from 'next/cache';

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

export async function GET() {
  try {
    const allSongs = await getAllSongs();
    return NextResponse.json(allSongs);
  } catch (error) {
    console.error('Error in GET /api/songs:', error);
    return NextResponse.json(
      { error: 'Error al obtener las canciones.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const manualImage = formData.get('image') as File | null;
    const manualName = formData.get('name') as string;
    const manualArtist = formData.get('artist') as string;
    const manualAlbum = formData.get('album') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extraer Metadatos (como fallback)
    const metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });

    let imageUrl: string | undefined;

    const isLocalFallback =
      !process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_READ_WRITE_TOKEN.startsWith('placeholder');

    // 1. Manejar Imagen (Manual o Metadatos)
    if (manualImage && manualImage.size > 0) {
      const imgBuffer = Buffer.from(await manualImage.arrayBuffer());
      const imgName = `manual-${manualImage.name}-${Date.now()}`;
      if (isLocalFallback) {
        imageUrl = await saveFileLocally(imgBuffer, 'album_covers', imgName);
      } else {
        const { url } = await put(`album_covers/${imgName}`, imgBuffer, { access: 'public' });
        imageUrl = url;
      }
    } else if (metadata.common.picture && metadata.common.picture.length > 0) {
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

    // 2. Subir Audio
    let audioUrl: string;
    if (isLocalFallback) {
      audioUrl = await saveFileLocally(buffer, 'audio', file.name);
    } else {
      const { url: blobUrl } = await put(`audio/${file.name}`, buffer, {
        access: 'public',
      });
      audioUrl = blobUrl;
    }

    // 3. Guardar en Base de Datos (Prioridad manual)
    const songData = {
      name: manualName || metadata.common.title || path.parse(file.name).name,
      artist: manualArtist || metadata.common.artist || 'Artista Desconocido',
      album: manualAlbum || metadata.common.album || 'Álbum Desconocido',
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

    return NextResponse.json({
      success: true,
      message: `Canción "${songData.name}" subida exitosamente.`,
      song: newSong,
    });
  } catch (error) {
    console.error('Error in POST /api/songs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error al procesar el archivo: ${errorMessage}` },
      { status: 500 }
    );
  }
}
