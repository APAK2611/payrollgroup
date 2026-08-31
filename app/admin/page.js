import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { INQUIRY_TYPES, CUSTOM_ATTRIBUTES } from '@/lib/schema';
import './admin.css';

export const dynamic = 'force-dynamic';

const TYPE_LABELS = Object.fromEntries(
  INQUIRY_TYPES.map((t) => [t.value, t.label])
);

function formatWhen(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AttrList({ attributes }) {
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

export default async function AdminLeadsPage() {
  // Guard (middleware also protects, this is defence in depth).
  const auth = createServerSupabase();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) redirect('/admin/login');

  // Read leads with the service key (RLS-locked tables, server-only).
  const supabase = createAdminClient();
  const { data: leads, error } = await supabase
    .from('contacts')
    .select(
      'id, type, subject, message, status, created_at, people ( name, email, phone, company, role, ok_to_contact, attributes )'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="admin-title">
            <span className="brand-mark">AP</span>
            <span>Payroll Association CRM</span>
          </div>
          <div className="admin-user">
            <span>{user.email}</span>
            <form action="/admin/signout" method="post">
              <button className="btn-ghost" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      <main className="admin-main">
        <div className="admin-h">
          <h1>Leads</h1>
          <span className="count">
            {leads ? `${leads.length} total · newest first` : ''}
          </span>
        </div>

        {error && (
          <div className="notice err">
            Could not load leads: {error.message}
          </div>
        )}

        <div className="table-wrap">
          {!error && leads && leads.length === 0 ? (
            <div className="empty">
              No leads yet. Submit the contact form on the site and it will
              appear here within seconds.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Custom attributes</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {(leads || []).map((lead) => {
                  const p = lead.people || {};
                  return (
                    <tr key={lead.id}>
                      <td>
                        <div className="lead-name">{p.name || '—'}</div>
                        <div className="lead-email">{p.email}</div>
                        {p.company && (
                          <div className="lead-email">
                            {p.role ? `${p.role}, ` : ''}
                            {p.company}
                          </div>
                        )}
                        {p.phone && <div className="lead-email">{p.phone}</div>}
                      </td>
                      <td>
                        <span className="badge">
                          {TYPE_LABELS[lead.type] || lead.type}
                        </span>
                      </td>
                      <td>
                        <div className="msg">{lead.message || '—'}</div>
                      </td>
                      <td>
                        <AttrList attributes={p.attributes} />
                      </td>
                      <td>
                        <span className="badge status">
                          {lead.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="when">
                          {formatWhen(lead.created_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
