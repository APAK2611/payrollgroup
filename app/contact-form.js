'use client';

import { useState } from 'react';
import { INQUIRY_TYPES, CUSTOM_ATTRIBUTES } from '@/lib/schema';

const initial = {
  name: '',
  email: '',
  phone: '',
  company: '',
  role: '',
  type: 'membership',
  subject: '',
  message: '',
  membership_type: '',
  organisation_size: '',
  membership_renewal_date: '',
  ok_to_contact: false,
};

export default function ContactForm() {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error
  const [error, setError] = useState('');

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="card">
        <div className="success-panel">
          <div className="check">✓</div>
          <h2>Thank you</h2>
          <p className="sub">
            We&rsquo;ve received your enquiry and someone from the team will be
            in touch shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Get in touch</h2>
      <p className="sub">Tell us a little about what you&rsquo;re after.</p>

      {status === 'error' && <div className="notice err">{error}</div>}

      <div className="field">
        <label>
          I&rsquo;m enquiring about <span className="req">*</span>
        </label>
        <select
          value={form.type}
          onChange={(e) => update('type', e.target.value)}
          required
        >
          {INQUIRY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="row2">
        <div className="field">
          <label>
            Name <span className="req">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>
            Email <span className="req">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label>Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Company</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => update('company', e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label>Your role</label>
        <input
          type="text"
          value={form.role}
          onChange={(e) => update('role', e.target.value)}
          placeholder="e.g. Payroll Manager"
        />
      </div>

      <div className="row2">
        <div className="field">
          <label>{CUSTOM_ATTRIBUTES.membership_type.label}</label>
          <select
            value={form.membership_type}
            onChange={(e) => update('membership_type', e.target.value)}
          >
            <option value="">Select…</option>
            {CUSTOM_ATTRIBUTES.membership_type.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{CUSTOM_ATTRIBUTES.organisation_size.label}</label>
          <select
            value={form.organisation_size}
            onChange={(e) => update('organisation_size', e.target.value)}
          >
            <option value="">Select…</option>
            {CUSTOM_ATTRIBUTES.organisation_size.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label>{CUSTOM_ATTRIBUTES.membership_renewal_date.label}</label>
        <input
          type="date"
          value={form.membership_renewal_date}
          onChange={(e) => update('membership_renewal_date', e.target.value)}
        />
      </div>

      <div className="field">
        <label>Message</label>
        <textarea
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          placeholder="How can we help?"
        />
      </div>

      <div className="checkbox">
        <input
          id="ok_to_contact"
          type="checkbox"
          checked={form.ok_to_contact}
          onChange={(e) => update('ok_to_contact', e.target.checked)}
        />
        <label htmlFor="ok_to_contact">
          Keep me updated with payroll news and events from the Australian
          Payroll Association.
        </label>
      </div>

      <button
        className="primary"
        type="submit"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  );
}
