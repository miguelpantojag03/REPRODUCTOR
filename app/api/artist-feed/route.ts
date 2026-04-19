import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist');
  const limit  = Math.min(Number(searchParams.get('limit') ?? 5), 10);

  if (!artist?.trim()) {
    return NextResponse.json([], { status: 400 });
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=${limit * 3}&media=music`;
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache 1 hour
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const results = (data.results || [])
      .filter((item: any) =>
        item.previewUrl &&
        item.artistName?.toLowerCase().includes(artist.toLowerCase())
      )
      .slice(0, limit)
      .map((item: any) => ({
        id:       `itunes-${item.trackId}`,
        name:     item.trackName,
        artist:   item.artistName,
        album:    item.collectionName || '',
        duration: Math.round((item.trackTimeMillis || 0) / 1000),
        imageUrl: item.artworkUrl100?.replace('100x100', '600x600') || null,
        audioUrl: item.previewUrl,
        genre:    item.primaryGenreName || null,
        isLocal:  false,
      }));

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    console.error('[artist-feed]', error);
    return NextResponse.json([]);
  }
}
