import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Use the correct env var — Vercel Postgres uses POSTGRES_URL
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  '';

if (!connectionString) {
  console.warn('[DB] No database connection string found. Set POSTGRES_URL in environment variables.');
}

// Connection pool — reuse connections across requests
// max: 10 connections, idle_timeout: 20s, connect_timeout: 10s
export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  // Disable SSL for local dev, require for production
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : 'require',
  onnotice: () => {}, // suppress notices
});

export const db = drizzle(client, { schema });
