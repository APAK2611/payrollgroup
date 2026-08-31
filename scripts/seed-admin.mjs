// Seed (or reset) one admin account in Supabase Auth, then verify the
// credentials by signing in. SERVER-ONLY (uses the service role key).
//
// Usage: node scripts/seed-admin.mjs <email> [password]
// If no password is given a strong one is generated and printed.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

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

const email = (process.argv[2] || '').trim().toLowerCase();
let password = process.argv[3];
if (!email) {
  console.error('Usage: node scripts/seed-admin.mjs <email> [password]');
  process.exit(1);
}
if (!password) {
  // 16 chars, url-safe, no ambiguous leading symbol.
  password = 'Ap!' + crypto.randomBytes(12).toString('base64url');
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUser(email) {
  // Paginate listUsers to find an existing account.
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function main() {
  const existing = await findUser(email);
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`Updated existing admin user: ${email}`);
  } else {
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`Created admin user: ${email}`);
  }

  // Verify by signing in with the public (anon/publishable) key.
  const pub = createClient(url, anonKey);
  const { data, error } = await pub.auth.signInWithPassword({ email, password });
  if (error || !data?.session) {
    throw new Error(`Sign-in verification FAILED: ${error?.message || 'no session'}`);
  }
  console.log('Sign-in verification: SUCCESS');
  console.log('----------------------------------------');
  console.log('  Email:    ', email);
  console.log('  Password: ', password);
  console.log('----------------------------------------');
}

main().catch((e) => {
  console.error('seed-admin failed:', e.message);
  process.exit(1);
});
