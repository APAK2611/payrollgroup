import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDateTime, formatMoney, titleCase } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      'id, product_name, amount_cents, currency, status, created_at, person_id, people ( name, email )'
    )
    .order('created_at', { ascending: false })
    .limit(500);

  const total = (orders || [])
    .filter((o) => o.status === 'paid')
    .reduce((sum, o) => sum + (o.amount_cents || 0), 0);

  return (
    <>
      <div className="admin-h">
        <h1>Orders</h1>
        <span className="count">
          {orders ? `${orders.length} total · ${formatMoney(total)} paid` : ''}
        </span>
      </div>

      {error && <div className="notice err">Could not load orders: {error.message}</div>}

      <div className="table-wrap">
        {!error && orders && orders.length === 0 ? (
          <div className="empty">
            No orders yet. Add one from a person&rsquo;s record.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Product / service</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(orders || []).map((o) => {
                const p = o.people || {};
                return (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/people/${o.person_id}`} className="lead-name link">
                        {p.name || '—'}
                      </Link>
                      <div className="lead-email">{p.email}</div>
                    </td>
                    <td>{o.product_name}</td>
                    <td>{formatMoney(o.amount_cents, o.currency)}</td>
                    <td>
                      <span className="badge status">{titleCase(o.status)}</span>
                    </td>
                    <td>
                      <span className="when">{formatDateTime(o.created_at)}</span>
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
