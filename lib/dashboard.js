import { createAdminClient } from '@/lib/supabase/admin';
import { CONTACT_STATUSES } from '@/lib/schema';

const DAY = 86400000;
const OPEN_PIPELINE = ['contacted', 'discovery_call', 'proposal'];

// Everything the weekly dashboard needs, computed from live data.
export async function getWeeklyMetrics() {
  const supabase = createAdminClient();
  const now = Date.now();
  const weekAgo = now - 7 * DAY;
  const twoWeeksAgo = now - 14 * DAY;

  const [{ data: contacts }, { data: activity }, { data: orders }] =
    await Promise.all([
      supabase
        .from('contacts')
        .select('id, type, status, created_at, person_id, people ( name, email, company )')
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase
        .from('activity_log')
        .select('contact_id, person_id, from_status, to_status, actor, created_at, people ( name )')
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase
        .from('orders')
        .select('amount_cents, status, created_at')
        .limit(1000),
    ]);

  const C = contacts || [];
  const A = activity || [];
  const O = orders || [];

  // Latest touch per contact = most recent activity, else its created_at.
  const lastTouch = new Map();
  for (const a of A) {
    const t = new Date(a.created_at).getTime();
    if (!lastTouch.has(a.contact_id) || t > lastTouch.get(a.contact_id)) {
      lastTouch.set(a.contact_id, t);
    }
  }
  const touchOf = (c) =>
    lastTouch.get(c.id) ?? new Date(c.created_at).getTime();

  const ageDays = (ms) => Math.floor((now - ms) / DAY);

  const newThisWeek = C.filter((c) => new Date(c.created_at).getTime() >= weekAgo);
  const newLastWeek = C.filter((c) => {
    const t = new Date(c.created_at).getTime();
    return t >= twoWeeksAgo && t < weekAgo;
  });

  // Action list: everything that needs a human this week.
  const awaiting = C.filter((c) => c.status === 'new_lead').map((c) => ({
    ...c,
    reason: 'Awaiting first contact',
    waiting: ageDays(new Date(c.created_at).getTime()),
  }));

  const stale = C.filter(
    (c) => OPEN_PIPELINE.includes(c.status) && touchOf(c) < weekAgo
  ).map((c) => ({
    ...c,
    reason: 'No movement in 7+ days',
    waiting: ageDays(touchOf(c)),
  }));

  const actionList = [...awaiting, ...stale].sort((a, b) => b.waiting - a.waiting);

  const wonThisWeek = A.filter(
    (a) => a.to_status === 'won' && new Date(a.created_at).getTime() >= weekAgo
  ).length;

  const revenueThisWeek = O.filter(
    (o) => o.status === 'paid' && new Date(o.created_at).getTime() >= weekAgo
  ).reduce((sum, o) => sum + (o.amount_cents || 0), 0);

  const pipelineByStage = CONTACT_STATUSES.map((s) => ({
    stage: s,
    count: C.filter((c) => c.status === s).length,
  }));

  const typeCounts = {};
  for (const c of newThisWeek) typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  const byTypeThisWeek = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return {
    now,
    weekStart: now - 7 * DAY,
    kpis: {
      newThisWeek: newThisWeek.length,
      newLastWeek: newLastWeek.length,
      awaiting: awaiting.length,
      inPipeline: C.filter((c) => OPEN_PIPELINE.includes(c.status)).length,
      wonThisWeek,
      revenueThisWeek,
    },
    actionList,
    pipelineByStage,
    byTypeThisWeek,
    recentActivity: A.slice(0, 6),
    totalContacts: C.length,
  };
}
