import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(DATABASE_URL, { ssl: DATABASE_URL.includes('neon') ? 'require' : false });

// Create guest user so "Continue without account" works
async function run() {
  const { createHash } = await import('crypto');
  const secret = process.env.AUTH_SECRET ?? 'fallback-secret';
  const hash = createHash('sha256').update('guest123' + secret).digest('hex');

  try {
    await sql`
      INSERT INTO users (id, email, name, password_hash, provider)
      VALUES (gen_random_uuid(), 'guest@music.local', 'Invitado', ${hash}, 'credentials')
      ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
    `;
    console.log('✓ Guest user created/updated');
  } catch (err: any) {
    console.error('Error:', err.message);
  }

  await sql.end();
}

run();
