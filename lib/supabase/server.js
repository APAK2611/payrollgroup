import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cookie-bound client for reading the signed-in admin's session
// inside server components, route handlers, and middleware.
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore when
            // middleware is refreshing the session.
          }
        },
      },
    }
  );
}
