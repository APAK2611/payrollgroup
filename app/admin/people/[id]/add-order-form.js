'use client';

import { useRef, useState, useTransition } from 'react';
import { createOrder } from '../../actions';

const STATUSES = ['pending', 'paid', 'refunded', 'cancelled'];

export default function AddOrderForm({ personId }) {
  const formRef = useRef(null);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState(null);

  function onSubmit(e) {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    formData.set('person_id', personId);
    setMsg(null);
    startTransition(async () => {
      const res = await createOrder(formData);
      if (res?.error) setMsg({ type: 'err', text: res.error });
      else {
        setMsg({ type: 'ok', text: 'Order added.' });
        formRef.current.reset();
      }
    });
  }

  return (
    <form ref={formRef} className="order-form" onSubmit={onSubmit}>
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      <div className="order-form-row">
        <div className="field">
          <label>Product / service</label>
          <input type="text" name="product_name" required placeholder="e.g. Professional Membership 2026" />
        </div>
      </div>
      <div className="order-form-row three">
        <div className="field">
          <label>Amount (AUD)</label>
          <input type="number" name="amount" step="0.01" min="0" placeholder="0.00" />
        </div>
        <div className="field">
          <label>Currency</label>
          <input type="text" name="currency" defaultValue="AUD" maxLength={3} />
        </div>
        <div className="field">
          <label>Status</label>
          <select name="status" defaultValue="pending">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button className="primary" type="submit" disabled={pending}>
        {pending ? 'Adding…' : 'Add order'}
      </button>
    </form>
  );
}
