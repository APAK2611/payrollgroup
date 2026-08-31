import { createServerSupabase } from '@/lib/supabase/server';
import Nav from './nav';
import './admin.css';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Login page (unauthenticated) renders bare, without the CRM chrome.
  if (!user) return children;

  return (
    <div className="admin-shell">
      <Nav email={user.email} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
