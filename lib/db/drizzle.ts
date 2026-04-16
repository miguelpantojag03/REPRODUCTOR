import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.POSTGRES_URL || '';

if (!connectionString && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ POSTGRES_URL environment variable is not set. Database connection will fail at runtime.');
}

export const client = postgres(connectionString);
export const db = drizzle(client, { schema });
