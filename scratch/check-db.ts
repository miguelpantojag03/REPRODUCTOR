import { db } from '../lib/db/drizzle';
import { sql } from 'drizzle-orm';

async function debug() {
  try {
    const result = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log('Tables in public schema:', result);

    const songsTable = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'songs'`);
    console.log('Columns in songs table:', songsTable);
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debug();
