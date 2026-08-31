import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function NewsletterPage() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data: people, error } = await supabase
    .from('people')
    .select('id, name, email, company, created_at')
    .eq('ok_to_contact', true)
    .order('created_at', { ascending: false })
    .limit(1000);

  return (
    <>
      <div className="admin-h">
        <h1>Newsletter</h1>
        <span className="count">
          {people ? `${people.length} subscribed (ok_to_contact = true)` : ''}
        </span>
      </div>

      {error && (
        <div className="notice err">Could not load subscribers: {error.message}</div>
      )}

      <div className="table-wrap">
        {!error && people && people.length === 0 ? (
          <div className="empty">
            No subscribers yet. People who tick the newsletter box on the
            contact form appear here.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Subscribed since</th>
              </tr>
            </thead>
            <tbody>
              {(people || []).map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/people/${p.id}`} className="lead-name link">
                      {p.name || '—'}
                    </Link>
                  </td>
                  <td>
                    <span className="lead-email">{p.email}</span>
                  </td>
                  <td>{p.company || '—'}</td>
                  <td>
                    <span className="when">{formatDate(p.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
