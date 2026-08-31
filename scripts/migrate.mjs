// Apply scripts/schema.sql to the Supabase Postgres database.
// Reads connection details from env (.env.local loaded manually).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

function connString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const pw =
    process.env.SUPABASE_DB_PASSWORD || process.env.SUPERBASE_PASSWORD;
  if (!url || !pw) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or DB password');
  const ref = new URL(url).hostname.split('.')[0];
  const enc = encodeURIComponent(pw);
  // Direct connection.
  return `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`;
}

async function main() {
  const file = process.argv[2] || 'schema.sql';
  const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
  console.log('Applying', file);
  const client = new pg.Client({
    connectionString: connString(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Connected. Applying schema…');
  await client.query(sql);
  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' and table_name in ('people','contacts') order by table_name"
  );
  console.log('Tables present:', rows.map((r) => r.table_name).join(', '));
  await client.end();
  console.log('Migration complete.');
}

main().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
