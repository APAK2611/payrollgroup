import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendInquiryEmails } from '@/lib/email';
import {
  INQUIRY_TYPE_VALUES,
  CUSTOM_ATTRIBUTES,
} from '@/lib/schema';

export const runtime = 'nodejs';

function clean(v) {
  return typeof v === 'string' ? v.trim() : v;
}

// Build the attributes jsonb from only the recognised custom keys,
// dropping empties and validating select options.
function buildAttributes(body) {
  const attrs = {};
  for (const [key, def] of Object.entries(CUSTOM_ATTRIBUTES)) {
    const raw = clean(body[key]);
    if (!raw) continue;
    if (def.kind === 'select' && !def.options.includes(raw)) continue;
    attrs[key] = raw;
  }
  return attrs;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = clean(body.email)?.toLowerCase();
  const name = clean(body.name);
  const type = clean(body.type);

  // Validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'A valid email is required.' },
      { status: 400 }
    );
  }
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!INQUIRY_TYPE_VALUES.includes(type)) {
    return NextResponse.json(
      { error: 'Please choose a valid enquiry type.' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const attributes = buildAttributes(body);
  const okToContact =
    body.ok_to_contact === true || type === 'newsletter_signup';

  // 1) Upsert the person by email (dedupe). Merge attributes with any
  //    existing ones so a repeat submit enriches rather than erases.
  const { data: existing, error: findErr } = await supabase
    .from('people')
    .select('id, attributes, ok_to_contact')
    .eq('email', email)
    .maybeSingle();

  if (findErr) {
    console.error('lookup error', findErr);
    return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
  }

  const personPayload = {
    email,
    name,
    phone: clean(body.phone) || null,
    company: clean(body.company) || null,
    role: clean(body.role) || null,
    source_site: 'payrollgroup.com.au',
    ok_to_contact: existing ? existing.ok_to_contact || okToContact : okToContact,
    attributes: { ...(existing?.attributes || {}), ...attributes },
    updated_at: new Date().toISOString(),
  };

  let personId;
  if (existing) {
    const { error: updErr } = await supabase
      .from('people')
      .update(personPayload)
      .eq('id', existing.id);
    if (updErr) {
      console.error('update person error', updErr);
      return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
    }
    personId = existing.id;
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from('people')
      .insert(personPayload)
      .select('id')
      .single();
    if (insErr) {
      console.error('insert person error', insErr);
      return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
    }
    personId = inserted.id;
  }

  // 2) Insert the linked inquiry, always landing as new_lead.
  const { error: contactErr } = await supabase.from('contacts').insert({
    person_id: personId,
    type,
    subject: clean(body.subject) || null,
    message: clean(body.message) || null,
    source: 'website_contact_form',
    status: 'new_lead',
    metadata: {},
  });

  if (contactErr) {
    console.error('insert contact error', contactErr);
    return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
  }

  // Best-effort confirmation + notification emails. Never blocks the
  // response — the lead is already saved.
  try {
    await sendInquiryEmails({
      person: { email, name, company: clean(body.company) },
      contact: { type, message: clean(body.message) },
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    });
  } catch (e) {
    console.error('email dispatch error', e.message);
  }

  return NextResponse.json({ ok: true });
}
