import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getWeeklyMetrics } from '@/lib/dashboard';
import { INQUIRY_TYPES } from '@/lib/schema';
import { formatMoney, formatDateTime, titleCase } from '@/lib/format';

export const dynamic = 'force-dynamic';

const TYPE_LABELS = Object.fromEntries(
  INQUIRY_TYPES.map((t) => [t.value, t.label])
);

function weekRange(now) {
  const start = new Date(now - 6 * 86400000);
  const opts = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('en-AU', opts)} – ${new Date(now).toLocaleDateString('en-AU', opts)}`;
}

function Delta({ current, previous }) {
  const diff = current - previous;
  if (diff === 0) return <span className="delta flat">= same as last week</span>;
  const up = diff > 0;
  return (
    <span className={`delta ${up ? 'up' : 'down'}`}>
      {up ? '▲' : '▼'} {Math.abs(diff)} vs last week
    </span>
  );
}

export default async function DashboardPage() {
  await requireAdmin();
  const m = await getWeeklyMetrics();
  const maxStage = Math.max(1, ...m.pipelineByStage.map((s) => s.count));

  return (
    <>
      <div className="admin-h">
        <div>
          <h1>Weekly review</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Week of {weekRange(m.now)}
          </p>
        </div>
        <Link href="/admin/inquiries" className="btn-ghost">
          All inquiries →
        </Link>
      </div>

      {/* KPI row */}
      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">New leads this week</div>
          <div className="kpi-value">{m.kpis.newThisWeek}</div>
          <Delta current={m.kpis.newThisWeek} previous={m.kpis.newLastWeek} />
        </div>
        <div className={`kpi ${m.kpis.awaiting > 0 ? 'alert' : ''}`}>
          <div className="kpi-label">Awaiting first contact</div>
          <div className="kpi-value">{m.kpis.awaiting}</div>
          <span className="delta flat">needs a reply</span>
        </div>
        <div className="kpi">
          <div className="kpi-label">Open in pipeline</div>
          <div className="kpi-value">{m.kpis.inPipeline}</div>
          <span className="delta flat">being worked</span>
        </div>
        <div className="kpi">
          <div className="kpi-label">Won this week</div>
          <div className="kpi-value">{m.kpis.wonThisWeek}</div>
          <span className="delta flat">{formatMoney(m.kpis.revenueThisWeek)} paid</span>
        </div>
      </div>

      {/* The weekly action list — the whole point */}
      <section className="panel action-panel">
        <div className="panel-head">
          <h2>Needs your attention</h2>
          <span className="count">{m.actionList.length} to action</span>
        </div>
        {m.actionList.length === 0 ? (
          <div className="empty">
            🎉 Nothing waiting — every lead has been actioned this week.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Type</th>
                <th>Stage</th>
                <th>Why</th>
                <th>Waiting</th>
              </tr>
            </thead>
            <tbody>
              {m.actionList.map((c) => {
                const p = c.people || {};
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/people/${c.person_id}`} className="lead-name link">
                        {p.name || p.email}
                      </Link>
                      {p.company && <div className="lead-email">{p.company}</div>}
                    </td>
                    <td>
                      <span className="badge">{TYPE_LABELS[c.type] || c.type}</span>
                    </td>
                    <td>
                      <span className="badge status">{titleCase(c.status)}</span>
                    </td>
                    <td className="muted">{c.reason}</td>
                    <td>
                      <span className={`wait ${c.waiting >= 7 ? 'hot' : c.waiting >= 3 ? 'warm' : ''}`}>
                        {c.waiting === 0 ? 'today' : `${c.waiting}d`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Two-up: pipeline + inquiry mix */}
      <div className="dash-2col">
        <section className="panel">
          <h2>Pipeline by stage</h2>
          <div className="bars">
            {m.pipelineByStage.map((s) => (
              <div className="bar-row" key={s.stage}>
                <span className="bar-label">{titleCase(s.stage)}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill stage-${s.stage}`}
                    style={{ width: `${(s.count / maxStage) * 100}%` }}
                  />
                </div>
                <span className="bar-count">{s.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>New inquiries this week</h2>
          {m.byTypeThisWeek.length === 0 ? (
            <p className="muted">No new inquiries this week.</p>
          ) : (
            <div className="bars">
              {m.byTypeThisWeek.map((t) => (
                <div className="bar-row" key={t.type}>
                  <span className="bar-label">{TYPE_LABELS[t.type] || t.type}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill accent"
                      style={{
                        width: `${(t.count / Math.max(1, ...m.byTypeThisWeek.map((x) => x.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="bar-count">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent activity */}
      <section className="panel">
        <h2>Recent activity</h2>
        {m.recentActivity.length === 0 ? (
          <p className="muted">No status changes yet.</p>
        ) : (
          <ul className="timeline">
            {m.recentActivity.map((a, i) => (
              <li key={i}>
                <strong>{a.people?.name || 'A lead'}</strong>
                <span className="badge">{titleCase(a.from_status)}</span>
                <span className="arrow">→</span>
                <span className="badge status">{titleCase(a.to_status)}</span>
                <span className="timeline-meta">
                  {a.actor ? `by ${a.actor} · ` : ''}
                  {formatDateTime(a.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
