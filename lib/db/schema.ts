import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export let songs = pgTable(
  'songs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    artist: text('artist').notNull(),
    album: text('album'),
    duration: integer('duration').notNull(), // Duration in seconds
    genre: text('genre'),
    bpm: integer('bpm'),
    key: text('key'),
    imageUrl: text('image_url'),
    audioUrl: text('audio_url').notNull(),
    isLocal: boolean('is_local').notNull().default(true),
    favorite: boolean('favorite').notNull().default(false),
    playCount: integer('play_count').notNull().default(0),
    lastPlayedAt: timestamp('last_played_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    nameIndex: index('idx_songs_name').on(table.name),
    artistIndex: index('idx_songs_artist').on(table.artist),
    albumIndex: index('idx_songs_album').on(table.album),
    genreIndex: index('idx_songs_genre').on(table.genre),
    bpmIndex: index('idx_songs_bpm').on(table.bpm),
    keyIndex: index('idx_songs_key').on(table.key),
    createdAtIndex: index('idx_songs_created_at').on(table.createdAt),
    nameTrigramIndex: index('idx_songs_name_trgm').using(
      'gin',
      sql`${table.name} gin_trgm_ops`
    ),
    artistTrigramIndex: index('idx_songs_artist_trgm').using(
      'gin',
      sql`${table.artist} gin_trgm_ops`
    ),
    albumTrigramIndex: index('idx_songs_album_trgm').using(
      'gin',
      sql`${table.album} gin_trgm_ops`
    ),
  })
);

export let playlists = pgTable(
  'playlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    coverUrl: text('cover_url'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    nameIndex: index('idx_playlists_name').on(table.name),
    createdAtIndex: index('idx_playlists_created_at').on(table.createdAt),
  })
);

export let playlistSongs = pgTable(
  'playlist_songs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playlistId: uuid('playlist_id')
      .notNull()
      .references(() => playlists.id),
    songId: uuid('song_id')
      .notNull()
      .references(() => songs.id),
    order: integer('order').notNull(),
  },
  (table) => ({
    playlistIdIndex: index('idx_playlist_songs_playlist_id').on(
      table.playlistId
    ),
    songIdIndex: index('idx_playlist_songs_song_id').on(table.songId),
    orderIndex: index('idx_playlist_songs_order').on(table.order),
    uniquePlaylistSongIndex: uniqueIndex('unq_playlist_song').on(
      table.playlistId,
      table.songId
    ),
  })
);

export let songsRelations = relations(songs, ({ many }) => ({
  playlistSongs: many(playlistSongs),
}));

export let playlistsRelations = relations(playlists, ({ many }) => ({
  playlistSongs: many(playlistSongs),
}));

export let playlistSongsRelations = relations(playlistSongs, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistSongs.playlistId],
    references: [playlists.id],
  }),
  song: one(songs, {
    fields: [playlistSongs.songId],
    references: [songs.id],
  }),
}));

/* ── Users (Auth) ─────────────────────────────────────────────── */
export let users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    name: text('name'),
    image: text('image'),
    phone: text('phone'),
    passwordHash: text('password_hash'),
    provider: text('provider').notNull().default('credentials'), // 'credentials' | 'google' | 'facebook'
    googleId: text('google_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIndex: uniqueIndex('idx_users_email').on(table.email),
    googleIdIndex: index('idx_users_google_id').on(table.googleId),
  })
);

export let accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export let usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export let accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));
