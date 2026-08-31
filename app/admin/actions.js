'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { CONTACT_STATUSES } from '@/lib/schema';

const ORDER_STATUSES = ['pending', 'paid', 'refunded', 'cancelled'];

// Move a contact to a new pipeline stage and write an activity_log row.
export async function updateContactStatus(contactId, toStatus) {
  const user = await requireAdmin();
  if (!CONTACT_STATUSES.includes(toStatus)) {
    return { error: 'Invalid status.' };
  }
  const supabase = createAdminClient();

  const { data: contact, error: readErr } = await supabase
    .from('contacts')
    .select('id, status, person_id')
    .eq('id', contactId)
    .single();
  if (readErr || !contact) return { error: 'Inquiry not found.' };
  if (contact.status === toStatus) return { ok: true }; // no-op

  const { error: updErr } = await supabase
    .from('contacts')
    .update({ status: toStatus })
    .eq('id', contactId);
  if (updErr) return { error: 'Could not update status.' };

  const { error: logErr } = await supabase.from('activity_log').insert({
    contact_id: contact.id,
    person_id: contact.person_id,
    from_status: contact.status,
    to_status: toStatus,
    actor: user.email,
  });
  if (logErr) console.error('activity_log insert failed', logErr);

  revalidatePath('/admin');
  revalidatePath(`/admin/people/${contact.person_id}`);
  return { ok: true };
}

// Add an order against a person.
export async function createOrder(formData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const personId = formData.get('person_id');
  const productName = (formData.get('product_name') || '').toString().trim();
  const amountDollars = parseFloat(formData.get('amount') || '0');
  const currency = (formData.get('currency') || 'AUD').toString().trim().toUpperCase();
  const status = (formData.get('status') || 'pending').toString();

  if (!personId) return { error: 'Missing person.' };
  if (!productName) return { error: 'Product name is required.' };
  if (!ORDER_STATUSES.includes(status)) return { error: 'Invalid status.' };

  const amountCents = Math.round((isNaN(amountDollars) ? 0 : amountDollars) * 100);

  const { error } = await supabase.from('orders').insert({
    person_id: personId,
    product_name: productName,
    amount_cents: amountCents,
    currency: currency || 'AUD',
    status,
  });
  if (error) return { error: 'Could not add order.' };

  revalidatePath(`/admin/people/${personId}`);
  revalidatePath('/admin/orders');
  return { ok: true };
}

// Toggle a person's newsletter opt-in (ok_to_contact).
export async function setOkToContact(personId, value) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('people')
    .update({ ok_to_contact: !!value, updated_at: new Date().toISOString() })
    .eq('id', personId);
  if (error) return { error: 'Could not update.' };
  revalidatePath(`/admin/people/${personId}`);
  revalidatePath('/admin/newsletter');
  return { ok: true };
}
