'use client';

import { createBrowserClient } from '@supabase/ssr';

// Browser client for the login form (email/password sign-in).
export function createClientSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE
  );
}
