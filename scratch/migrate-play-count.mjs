import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

// Load env
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const client = new Client({ connectionString: envVars.DATABASE_URL });

try {
  await client.connect();
  await client.query(`
    ALTER TABLE songs ADD COLUMN IF NOT EXISTS play_count integer NOT NULL DEFAULT 0;
    ALTER TABLE songs ADD COLUMN IF NOT EXISTS last_played_at timestamp;
  `);
  console.log('Migration applied successfully: play_count and last_played_at columns added');
} catch (err) {
  console.error('Migration error:', err.message);
} finally {
  await client.end();
}
