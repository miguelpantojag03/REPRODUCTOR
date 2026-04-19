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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/aac'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function ensureDir(dir: string) {
  if (!existsSync(dir)) await fs.mkdir(dir, { recursive: true });
}

async function saveFileLocally(buffer: Buffer, folder: string, fileName: string) {
  // Sanitize filename
  const safe = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const publicPath = path.join(process.cwd(), 'public', folder);
  await ensureDir(publicPath);
  const filePath = path.join(publicPath, safe);
  await fs.writeFile(filePath, buffer);
  return `/${folder}/${safe}`;
}

const isLocalEnv = () =>
  !process.env.BLOB_READ_WRITE_TOKEN ||
  process.env.BLOB_READ_WRITE_TOKEN.startsWith('placeholder') ||
  process.env.BLOB_READ_WRITE_TOKEN === '';

async function uploadFile(buffer: Buffer, remotePath: string, mimeType: string): Promise<string> {
  if (isLocalEnv()) {
    const folder = remotePath.split('/')[0];
    const fileName = remotePath.split('/').slice(1).join('/');
    return saveFileLocally(buffer, folder, fileName);
  }
  const { url } = await put(remotePath, buffer, { access: 'public', contentType: mimeType });
  return url;
}

/* ── GET /api/songs ─────────────────────────────────────────── */
export async function GET() {
  try {
    const allSongs = await getAllSongs();
    return NextResponse.json(allSongs, {
      headers: { 'Cache-Control': 'no-store' }, // Always fresh for client
    });
  } catch (error) {
    console.error('[GET /api/songs]', error);
    return NextResponse.json({ error: 'Error al obtener las canciones.' }, { status: 500 });
  }
}

/* ── POST /api/songs ────────────────────────────────────────── */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file        = formData.get('file')   as File | null;
    const manualImage = formData.get('image')  as File | null;
    const manualName  = formData.get('name')   as string | null;
    const manualArtist = formData.get('artist') as string | null;
    const manualAlbum  = formData.get('album')  as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo de audio.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `El archivo es demasiado grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB.` }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse metadata from ID3 tags
    let metadata: Awaited<ReturnType<typeof parseBuffer>> | null = null;
    try {
      metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });
    } catch {
      // Metadata parsing failed — use filename as fallback
    }

    // Handle cover image
    let imageUrl: string | null = null;
    if (manualImage && manualImage.size > 0) {
      const imgBuffer = Buffer.from(await manualImage.arrayBuffer());
      const imgExt = manualImage.name.split('.').pop() || 'jpg';
      const imgName = `covers/${Date.now()}-cover.${imgExt}`;
      imageUrl = await uploadFile(imgBuffer, imgName, manualImage.type || 'image/jpeg');
    } else if (metadata?.common.picture?.[0]) {
      const pic = metadata.common.picture[0];
      const imgExt = pic.format?.split('/')[1] || 'jpg';
      const imgName = `covers/${Date.now()}-cover.${imgExt}`;
      imageUrl = await uploadFile(Buffer.from(pic.data), imgName, pic.format || 'image/jpeg');
    }

    // Upload audio
    const audioExt = file.name.split('.').pop() || 'mp3';
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const audioName = `audio/${Date.now()}-${safeFileName}`;
    const audioUrl = await uploadFile(buffer, audioName, file.type || 'audio/mpeg');

    // Build song data with fallbacks
    const songData = {
      name:     manualName?.trim()   || metadata?.common.title   || path.parse(file.name).name,
      artist:   manualArtist?.trim() || metadata?.common.artist  || 'Artista Desconocido',
      album:    manualAlbum?.trim()  || metadata?.common.album   || null,
      duration: Math.round(metadata?.format.duration || 0),
      genre:    metadata?.common.genre?.[0] || null,
      bpm:      metadata?.common.bpm ? Math.round(metadata.common.bpm) : null,
      key:      metadata?.common.key || null,
      imageUrl,
      audioUrl,
      isLocal:  isLocalEnv(),
      favorite: false,
    };

    const [newSong] = await db.insert(songs).values(songData).returning();

    // Invalidate cache
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      message: `"${songData.name}" añadida a tu biblioteca.`,
      song: newSong,
    });
  } catch (error) {
    console.error('[POST /api/songs]', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al procesar el archivo: ${msg}` }, { status: 500 });
  }
}
