import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { INQUIRY_TYPES, CUSTOM_ATTRIBUTES } from '@/lib/schema';
import { formatDateTime } from '@/lib/format';
import StatusSelect from './status-select';

export const dynamic = 'force-dynamic';

const TYPE_LABELS = Object.fromEntries(
  INQUIRY_TYPES.map((t) => [t.value, t.label])
);

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

export default async function InquiriesPage() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data: leads, error } = await supabase
    .from('contacts')
    .select(
      'id, type, subject, message, status, created_at, person_id, people ( name, email, phone, company, role, attributes )'
    )
    .order('created_at', { ascending: false })
    .limit(500);

  return (
    <>
      <div className="admin-h">
        <h1>Inquiries</h1>
        <span className="count">
          {leads ? `${leads.length} total · newest first` : ''}
        </span>
      </div>

      {error && (
        <div className="notice err">Could not load inquiries: {error.message}</div>
      )}

      <div className="table-wrap">
        {!error && leads && leads.length === 0 ? (
          <div className="empty">No inquiries yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Type</th>
                <th>Message</th>
                <th>Custom attributes</th>
                <th>Stage</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {(leads || []).map((lead) => {
                const p = lead.people || {};
                return (
                  <tr key={lead.id}>
                    <td>
                      <Link
                        href={`/admin/people/${lead.person_id}`}
                        className="lead-name link"
                      >
                        {p.name || '—'}
                      </Link>
                      <div className="lead-email">{p.email}</div>
                      {p.company && (
                        <div className="lead-email">
                          {p.role ? `${p.role}, ` : ''}
                          {p.company}
                        </div>
                      )}
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
                      <StatusSelect contactId={lead.id} status={lead.status} />
                    </td>
                    <td>
                      <span className="when">{formatDateTime(lead.created_at)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
