import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Sanitize filename — prevent path traversal attacks
  const sanitized = path.basename(decodeURIComponent(filename));
  if (!sanitized || sanitized.includes('..')) {
    return new NextResponse('Invalid filename', { status: 400 });
  }

  // Try multiple locations where audio files might be stored
  const searchPaths = [
    path.join(process.cwd(), 'public', 'audio', sanitized),
    path.join(process.cwd(), 'tracks', sanitized),
    path.join(process.cwd(), 'public', sanitized),
  ];

  for (const filePath of searchPaths) {
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) continue;

      const fileBuffer = await fs.readFile(filePath);

      // Determine MIME type from extension
      const ext = path.extname(sanitized).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.mp3':  'audio/mpeg',
        '.m4a':  'audio/mp4',
        '.ogg':  'audio/ogg',
        '.wav':  'audio/wav',
        '.flac': 'audio/flac',
        '.aac':  'audio/aac',
        '.webm': 'audio/webm',
      };
      const contentType = mimeTypes[ext] || 'audio/mpeg';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type':   contentType,
          'Content-Length': fileBuffer.byteLength.toString(),
          'Accept-Ranges':  'bytes',
          'Cache-Control':  'public, max-age=31536000, immutable',
        },
      });
    } catch {
      // File not found at this path, try next
      continue;
    }
  }

  return new NextResponse('Audio file not found', { status: 404 });
}
