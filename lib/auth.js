import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

// Returns the signed-in admin user or redirects to the login page.
// Used by admin pages and server actions as a defence-in-depth guard
// (middleware also protects /admin).
export async function requireAdmin() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  return user;
}
