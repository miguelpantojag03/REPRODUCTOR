import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(DATABASE_URL, { ssl: DATABASE_URL.includes('neon') ? 'require' : false });

async function migrate() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" text NOT NULL,
        "name" text,
        "image" text,
        "phone" text,
        "password_hash" text,
        "provider" text NOT NULL DEFAULT 'credentials',
        "google_id" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "users_email_unique" UNIQUE("email")
      )
    `;
    console.log('✓ users table created');

    await sql`CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_users_google_id" ON "users" ("google_id")`;

    await sql`
      CREATE TABLE IF NOT EXISTS "accounts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "provider" text NOT NULL,
        "provider_account_id" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `;
    console.log('✓ accounts table created');
  } catch (err: any) {
    console.error('Migration error:', err.message);
  }

  await sql.end();
  console.log('Done.');
}

migrate();
