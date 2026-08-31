// Seed 10 realistic sample leads for the weekly dashboard.
// Sample people are tagged source_site='sample_data' so they are easy to
// tell apart from real leads and to purge later:
//   node scripts/seed-samples.mjs         # insert samples
//   node scripts/seed-samples.mjs --clear # remove all sample data
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs
  .readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
  .split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const SAMPLE_TAG = 'sample_data';
const ACTOR = 'kylie@austpayroll.com.au';
const DAY = 86400000;
const iso = (daysAgo) => new Date(Date.now() - daysAgo * DAY).toISOString();

async function clear() {
  const { data } = await s
    .from('people')
    .delete()
    .eq('source_site', SAMPLE_TAG)
    .select('id');
  console.log(`Removed ${data?.length || 0} sample people (cascade).`);
}

const RECORDS = [
  { name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '0412 445 118', company: 'Ledger Partners', role: 'Payroll Manager', type: 'membership', status: 'new_lead', created: 1, ok: true, attrs: { membership_type: 'Professional Member', organisation_size: '51–200', membership_renewal_date: '2026-10-15' }, message: 'Looking to renew our team membership and add two seats.', journey: [] },
  { name: 'Tom Nguyen', email: 'tom.nguyen@example.com', phone: '0433 902 771', company: 'BuildRight Group', role: 'HR Director', type: 'training', status: 'new_lead', created: 2, ok: false, attrs: { membership_type: 'Non-Member', organisation_size: '201–500' }, message: 'Need STP Phase 2 training for 6 payroll staff.', journey: [] },
  { name: 'Aisha Rahman', email: 'aisha.rahman@example.com', phone: '0401 556 234', company: 'Coastal Care', role: 'Finance Lead', type: 'consulting', status: 'contacted', created: 4, ok: false, attrs: { membership_type: 'Beryl Member', organisation_size: '1,000+' }, message: 'Award interpretation review across three states.', journey: [{ to: 'contacted', d: 3 }] },
  { name: "Liam O'Brien", email: 'liam.obrien@example.com', phone: '0407 118 990', company: 'Nimbus Tech', role: 'CFO', type: 'consulting', status: 'discovery_call', created: 6, ok: false, attrs: { membership_type: 'Non-Member', organisation_size: '501–1,000' }, message: 'Payroll transformation ahead of an ERP migration.', journey: [{ to: 'contacted', d: 5 }, { to: 'discovery_call', d: 4 }] },
  { name: 'Sophie Chen', email: 'sophie.chen@example.com', phone: '0422 673 401', company: 'GreenLeaf Retail', role: 'Payroll Officer', type: 'membership', status: 'proposal', created: 9, ok: true, attrs: { membership_type: 'Professional Member', organisation_size: '51–200', membership_renewal_date: '2026-09-30' }, message: 'Comparing Professional vs Beryl membership for our team.', journey: [{ to: 'contacted', d: 9 }, { to: 'discovery_call', d: 8 }, { to: 'proposal', d: 8 }] },
  { name: 'Marcus Webb', email: 'marcus.webb@example.com', phone: '0438 220 517', company: 'Apex Logistics', role: 'Operations Manager', type: 'training', status: 'won', created: 10, ok: false, attrs: { membership_type: 'Non-Member', organisation_size: '201–500' }, message: 'On-site training day for the payroll team.', journey: [{ to: 'contacted', d: 9 }, { to: 'discovery_call', d: 7 }, { to: 'proposal', d: 5 }, { to: 'won', d: 3 }], order: { product: 'Corporate Training Day', cents: 480000, status: 'paid', d: 3 } },
  { name: 'Ella Martin', email: 'ella.martin@example.com', phone: '0410 774 668', company: 'Sunrise Health', role: 'HR Manager', type: 'membership', status: 'won', created: 13, ok: true, attrs: { membership_type: 'Professional Member', organisation_size: '51–200', membership_renewal_date: '2027-01-20' }, message: 'Signing up for Professional membership.', journey: [{ to: 'contacted', d: 12 }, { to: 'proposal', d: 12 }, { to: 'won', d: 12 }], order: { product: 'Professional Membership 2026', cents: 89000, status: 'paid', d: 12 } },
  { name: 'Jack Wilson', email: 'jack.wilson@example.com', phone: '0455 300 129', company: 'Metro Foods', role: 'Payroll Lead', type: 'general_enquiry', status: 'lost', created: 9, ok: false, attrs: { membership_type: 'Non-Member', organisation_size: '1–50' }, message: 'General question about super changes — went with internal resourcing.', journey: [{ to: 'contacted', d: 8 }, { to: 'lost', d: 7 }] },
  { name: 'Hannah Lee', email: 'hannah.lee@example.com', phone: '0424 889 552', company: 'Bright Futures Education', role: 'Bursar', type: 'newsletter_signup', status: 'new_lead', created: 3, ok: true, attrs: { organisation_size: '1–50' }, message: 'Please add me to the payroll updates newsletter.', journey: [] },
  { name: 'Daniel Kumar', email: 'daniel.kumar@example.com', phone: '0417 663 208', company: 'Fortis Mining', role: 'Payroll Systems Analyst', type: 'consulting', status: 'contacted', created: 8, ok: false, attrs: { membership_type: 'Non-Member', organisation_size: '1,000+' }, message: 'Scoping a compliance audit for FY26.', journey: [{ to: 'contacted', d: 8 }] },
];

async function seed() {
  await clear(); // idempotent re-seed
  let people = 0, contacts = 0, logs = 0, orders = 0;
  for (const r of RECORDS) {
    const { data: person, error: pErr } = await s
      .from('people')
      .insert({
        email: r.email,
        name: r.name,
        phone: r.phone,
        company: r.company,
        role: r.role,
        source_site: SAMPLE_TAG,
        ok_to_contact: r.ok,
        attributes: r.attrs,
        created_at: iso(r.created),
        updated_at: iso(r.created),
      })
      .select('id')
      .single();
    if (pErr) { console.error(r.email, pErr.message); continue; }
    people++;

    const { data: contact, error: cErr } = await s
      .from('contacts')
      .insert({
        person_id: person.id,
        type: r.type,
        subject: null,
        message: r.message,
        source: 'website_contact_form',
        status: r.status,
        metadata: { sample: true },
        created_at: iso(r.created),
      })
      .select('id')
      .single();
    if (cErr) { console.error(r.email, cErr.message); continue; }
    contacts++;

    let prev = 'new_lead';
    for (const step of r.journey) {
      const { error } = await s.from('activity_log').insert({
        contact_id: contact.id,
        person_id: person.id,
        from_status: prev,
        to_status: step.to,
        actor: ACTOR,
        created_at: iso(step.d),
      });
      if (!error) logs++;
      prev = step.to;
    }

    if (r.order) {
      const { error } = await s.from('orders').insert({
        person_id: person.id,
        product_name: r.order.product,
        amount_cents: r.order.cents,
        currency: 'AUD',
        status: r.order.status,
        created_at: iso(r.order.d),
      });
      if (!error) orders++;
    }
  }
  console.log(`Seeded: ${people} people, ${contacts} contacts, ${logs} activity rows, ${orders} orders.`);
}

const run = process.argv.includes('--clear') ? clear() : seed();
run.catch((e) => { console.error(e); process.exit(1); });
