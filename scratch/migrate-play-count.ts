import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const sql = postgres(process.env.DATABASE_URL!);

async function migrate() {
  try {
    await sql`ALTER TABLE songs ADD COLUMN IF NOT EXISTS play_count integer NOT NULL DEFAULT 0`;
    console.log('✓ Added play_count column');
  } catch (err: any) {
    console.log('play_count:', err.message);
  }

  try {
    await sql`ALTER TABLE songs ADD COLUMN IF NOT EXISTS last_played_at timestamp`;
    console.log('✓ Added last_played_at column');
  } catch (err: any) {
    console.log('last_played_at:', err.message);
  }

  await sql.end();
  console.log('Migration complete');
}

migrate();
