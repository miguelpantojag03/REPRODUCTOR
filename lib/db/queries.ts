import { eq, sql, desc, asc, and, ilike, or } from 'drizzle-orm';
import { unstable_cache, revalidatePath } from 'next/cache';
import { db } from './drizzle';
import { songs, playlists, playlistSongs } from './schema';

/* ── Cache invalidation helpers ─────────────────────────────── */
export function invalidateSongs() {
  revalidatePath('/', 'layout');
}
export function invalidatePlaylists() {
  revalidatePath('/', 'layout');
}
export function invalidateAll() {
  revalidatePath('/', 'layout');
}

/* ── Songs ───────────────────────────────────────────────────── */
export const getAllSongs = unstable_cache(
  async () => db.select().from(songs).orderBy(asc(songs.name)),
  ['all-songs'],
  { tags: ['songs'], revalidate: 60 }
);

export const getSongById = unstable_cache(
  async (id: string) => db.query.songs.findFirst({ where: eq(songs.id, id) }),
  ['song-by-id'],
  { tags: ['songs'] }
);

export const getRecentlyAddedSongs = unstable_cache(
  async (limit = 10) =>
    db.select().from(songs).orderBy(desc(songs.createdAt)).limit(limit),
  ['recently-added-songs'],
  { tags: ['songs'], revalidate: 30 }
);

export const getRecentlyPlayedSongs = unstable_cache(
  async (limit = 8) =>
    db
      .select()
      .from(songs)
      .where(sql`${songs.lastPlayedAt} IS NOT NULL`)
      .orderBy(desc(songs.lastPlayedAt))
      .limit(limit),
  ['recently-played-songs'],
  { tags: ['songs'], revalidate: 10 }
);

export const getMostPlayedSongs = unstable_cache(
  async (limit = 10) =>
    db
      .select()
      .from(songs)
      .where(sql`${songs.playCount} > 0`)
      .orderBy(desc(songs.playCount))
      .limit(limit),
  ['most-played-songs'],
  { tags: ['songs'], revalidate: 30 }
);

export const searchSongs = async (searchTerm: string) => {
  if (!searchTerm.trim()) return [];

  const q = `%${searchTerm.toLowerCase()}%`;

  // Simple ILIKE search — works without pg_trgm extension
  return db
    .select()
    .from(songs)
    .where(
      or(
        ilike(songs.name,   q),
        ilike(songs.artist, q),
        sql`COALESCE(${songs.album}, '') ILIKE ${q}`
      )
    )
    .orderBy(asc(songs.name))
    .limit(50);
};

/* ── Playlists ───────────────────────────────────────────────── */
export const getAllPlaylists = unstable_cache(
  async () => db.select().from(playlists).orderBy(desc(playlists.createdAt)),
  ['all-playlists'],
  { tags: ['playlists'], revalidate: 60 }
);

export const getPlaylistWithSongs = unstable_cache(
  async (id: string) => {
    const result = await db.query.playlists.findFirst({
      where: eq(playlists.id, id),
      with: {
        playlistSongs: {
          columns: { order: true },
          with: { song: true },
          orderBy: asc(playlistSongs.order),
        },
      },
    });

    if (!result) return null;

    const songList = result.playlistSongs.map(ps => ({
      ...ps.song,
      order: ps.order,
    }));

    return {
      ...result,
      songs: songList,
      trackCount: songList.length,
      duration: songList.reduce((t, s) => t + s.duration, 0),
    };
  },
  ['playlist-with-songs'],
  { tags: ['playlists', 'songs'] }
);

/* ── Mutations ───────────────────────────────────────────────── */
export const createPlaylist = async (id: string, name: string, coverUrl?: string) => {
  const [result] = await db.insert(playlists).values({ id, name, coverUrl }).returning();
  invalidatePlaylists();
  return result;
};

export const updatePlaylist = async (id: string, name: string, coverUrl?: string) => {
  const [result] = await db
    .update(playlists)
    .set({ name, coverUrl, updatedAt: new Date() })
    .where(eq(playlists.id, id))
    .returning();
  invalidatePlaylists();
  return result;
};

export const deletePlaylist = async (id: string) => {
  await db.delete(playlistSongs).where(eq(playlistSongs.playlistId, id));
  await db.delete(playlists).where(eq(playlists.id, id));
  invalidatePlaylists();
};

export const addSongToPlaylist = async (playlistId: string, songId: string, order: number) => {
  const result = await db.insert(playlistSongs).values({ playlistId, songId, order });
  invalidatePlaylists();
  return result;
};

export const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
  const result = await db
    .delete(playlistSongs)
    .where(and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId)));
  invalidatePlaylists();
  return result;
};

export const deleteSong = async (id: string) => {
  await db.delete(playlistSongs).where(eq(playlistSongs.songId, id));
  await db.delete(songs).where(eq(songs.id, id));
  invalidateAll();
};
