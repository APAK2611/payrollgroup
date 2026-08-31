// Best-effort transactional email via Resend's REST API.
// Never throws to the caller — a failed/absent key must not block lead
// capture. Sends two messages on a new inquiry:
//   1) a confirmation to the person who submitted, and
//   2) an internal notification to RESEND_NOTIFY_TO (if set).

import { INQUIRY_TYPES } from '@/lib/schema';

const TYPE_LABELS = Object.fromEntries(INQUIRY_TYPES.map((t) => [t.value, t.label]));

async function send(payload) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { skipped: 'no RESEND_API_KEY' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  return res.json();
}

function esc(s) {
  return String(s || '').replace(/[<>&]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])
  );
}

export async function sendInquiryEmails({ person, contact, siteUrl }) {
  const from = process.env.RESEND_FROM;
  if (!from) return; // not configured yet
  const typeLabel = TYPE_LABELS[contact.type] || contact.type;
  const firstName = (person.name || '').split(' ')[0] || 'there';

  // 1) Confirmation to the person.
  try {
    await send({
      from,
      to: person.email,
      subject: 'We’ve received your enquiry — Australian Payroll Association',
      html: `
        <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d1f24;line-height:1.6">
          <p>Hi ${esc(firstName)},</p>
          <p>Thanks for getting in touch with the Australian Payroll Association about
          <strong>${esc(typeLabel)}</strong>. We’ve received your enquiry and someone
          from our team will be in touch shortly.</p>
          ${contact.message ? `<p style="color:#6b7280">Your message:<br>“${esc(contact.message)}”</p>` : ''}
          <p>Kind regards,<br>Australian Payroll Association</p>
        </div>`,
    });
  } catch (e) {
    console.error('confirmation email failed', e.message);
  }

  // 2) Internal notification.
  const notify = process.env.RESEND_NOTIFY_TO;
  if (notify) {
    try {
      await send({
        from,
        to: notify,
        subject: `New ${typeLabel} lead: ${person.name || person.email}`,
        html: `
          <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d1f24;line-height:1.6">
            <h2 style="margin:0 0 8px">New ${esc(typeLabel)} enquiry</h2>
            <p style="margin:0 0 12px"><strong>${esc(person.name || '—')}</strong> &lt;${esc(person.email)}&gt;
            ${person.company ? `· ${esc(person.company)}` : ''}</p>
            ${contact.message ? `<p style="color:#40454d">“${esc(contact.message)}”</p>` : ''}
            ${siteUrl ? `<p><a href="${esc(siteUrl)}/admin">Open in the CRM →</a></p>` : ''}
          </div>`,
      });
    } catch (e) {
      console.error('notification email failed', e.message);
    }
  }
}
