import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { INQUIRY_TYPES, CUSTOM_ATTRIBUTES } from '@/lib/schema';
import { formatDateTime, formatMoney, titleCase } from '@/lib/format';
import StatusSelect from '../../status-select';
import NewsletterToggle from './newsletter-toggle';
import AddOrderForm from './add-order-form';

export const dynamic = 'force-dynamic';

const TYPE_LABELS = Object.fromEntries(
  INQUIRY_TYPES.map((t) => [t.value, t.label])
);

export default async function PersonPage({ params }) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { id } = params;

  const { data: person } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!person) notFound();

  const [{ data: contacts }, { data: activity }, { data: orders }] =
    await Promise.all([
      supabase
        .from('contacts')
        .select('id, type, subject, message, status, created_at')
        .eq('person_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('activity_log')
        .select('id, from_status, to_status, actor, note, created_at')
        .eq('person_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('id, product_name, amount_cents, currency, status, created_at')
        .eq('person_id', id)
        .order('created_at', { ascending: false }),
    ]);

  const attrs = Object.entries(person.attributes || {}).filter(([, v]) => v);

  return (
    <>
      <div className="crumbs">
        <Link href="/admin/people" className="link">
          ← People
        </Link>
      </div>

      <div className="admin-h">
        <h1>{person.name || person.email}</h1>
      </div>

      <div className="detail-grid">
        {/* Left column: identity + attributes + newsletter */}
        <div className="detail-col">
          <section className="panel">
            <h2>Contact</h2>
            <dl className="kv">
              <dt>Email</dt>
              <dd>{person.email}</dd>
              {person.phone && (
                <>
                  <dt>Phone</dt>
                  <dd>{person.phone}</dd>
                </>
              )}
              {person.company && (
                <>
                  <dt>Company</dt>
                  <dd>{person.company}</dd>
                </>
              )}
              {person.role && (
                <>
                  <dt>Role</dt>
                  <dd>{person.role}</dd>
                </>
              )}
              {person.source_site && (
                <>
                  <dt>Source</dt>
                  <dd>{person.source_site}</dd>
                </>
              )}
            </dl>
          </section>

          <section className="panel">
            <h2>Custom attributes</h2>
            {attrs.length === 0 ? (
              <p className="muted">None recorded.</p>
            ) : (
              <dl className="kv">
                {attrs.map(([k, v]) => (
                  <div key={k} style={{ display: 'contents' }}>
                    <dt>{CUSTOM_ATTRIBUTES[k]?.label || k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="panel">
            <h2>Newsletter</h2>
            <NewsletterToggle personId={person.id} initial={person.ok_to_contact} />
          </section>
        </div>

        {/* Right column: inquiries, orders, activity */}
        <div className="detail-col">
          <section className="panel">
            <h2>Inquiries ({contacts?.length || 0})</h2>
            {!contacts || contacts.length === 0 ? (
              <p className="muted">No inquiries.</p>
            ) : (
              <div className="stack">
                {contacts.map((c) => (
                  <div key={c.id} className="mini-row">
                    <div>
                      <span className="badge">
                        {TYPE_LABELS[c.type] || c.type}
                      </span>
                      {c.message && <div className="msg">{c.message}</div>}
                      <div className="when">{formatDateTime(c.created_at)}</div>
                    </div>
                    <StatusSelect contactId={c.id} status={c.status} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Orders ({orders?.length || 0})</h2>
            {orders && orders.length > 0 && (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.product_name}</td>
                      <td>{formatMoney(o.amount_cents, o.currency)}</td>
                      <td>
                        <span className="badge status">{titleCase(o.status)}</span>
                      </td>
                      <td className="when">{formatDateTime(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <AddOrderForm personId={person.id} />
          </section>

          <section className="panel">
            <h2>Activity ({activity?.length || 0})</h2>
            {!activity || activity.length === 0 ? (
              <p className="muted">No status changes yet.</p>
            ) : (
              <ul className="timeline">
                {activity.map((a) => (
                  <li key={a.id}>
                    <span className="badge">{titleCase(a.from_status)}</span>
                    <span className="arrow">→</span>
                    <span className="badge status">{titleCase(a.to_status)}</span>
                    <span className="timeline-meta">
                      by {a.actor || 'system'} · {formatDateTime(a.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
