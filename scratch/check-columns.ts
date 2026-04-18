import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const sql = postgres(process.env.DATABASE_URL!);

const result = await sql`
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'songs'
  ORDER BY ordinal_position
`;

console.log('Songs table columns:');
result.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} (default: ${r.column_default})`));

await sql.end();
