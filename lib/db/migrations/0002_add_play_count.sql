ALTER TABLE "songs" ADD COLUMN IF NOT EXISTS "play_count" integer NOT NULL DEFAULT 0;
ALTER TABLE "songs" ADD COLUMN IF NOT EXISTS "last_played_at" timestamp;
