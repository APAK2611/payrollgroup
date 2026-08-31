import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { CUSTOM_ATTRIBUTES } from '@/lib/schema';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

function Attrs({ attributes }) {
  const entries = Object.entries(attributes || {}).filter(([, v]) => v);
  if (entries.length === 0) return <span className="attrs">—</span>;
  return (
    <div className="attrs">
      {entries.map(([k, v]) => (
        <span key={k}>
          <b>{CUSTOM_ATTRIBUTES[k]?.label || k}:</b> {v}
        </span>
      ))}
    </div>
  );
}

export default async function PeoplePage({ searchParams }) {
  await requireAdmin();
  const q = (searchParams?.q || '').trim();
  const supabase = createAdminClient();

  let query = supabase
    .from('people')
    .select('id, name, email, phone, company, role, ok_to_contact, attributes, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (q) {
    const like = `%${q}%`;
    query = query.or(
      `name.ilike.${like},email.ilike.${like},company.ilike.${like}`
    );
  }

  const { data: people, error } = await query;

  return (
    <>
      <div className="admin-h">
        <h1>People</h1>
        <span className="count">{people ? `${people.length} shown` : ''}</span>
      </div>

      <form className="search-bar" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, email, or company…"
        />
        <button className="btn-ghost" type="submit">
          Search
        </button>
        {q && (
          <Link className="btn-ghost" href="/admin/people">
            Clear
          </Link>
        )}
      </form>

      {error && <div className="notice err">Could not load people: {error.message}</div>}

      <div className="table-wrap">
        {!error && people && people.length === 0 ? (
          <div className="empty">
            {q ? `No people match “${q}”.` : 'No people yet.'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Custom attributes</th>
                <th>Newsletter</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {(people || []).map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/people/${p.id}`} className="lead-name link">
                      {p.name || '—'}
                    </Link>
                    {p.company && (
                      <div className="lead-email">
                        {p.role ? `${p.role}, ` : ''}
                        {p.company}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="lead-email">{p.email}</div>
                    {p.phone && <div className="lead-email">{p.phone}</div>}
                  </td>
                  <td>
                    <Attrs attributes={p.attributes} />
                  </td>
                  <td>
                    {p.ok_to_contact ? (
                      <span className="badge status">Subscribed</span>
                    ) : (
                      <span className="attrs">—</span>
                    )}
                  </td>
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
