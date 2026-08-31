'use client';

import { useState, useTransition } from 'react';
import { updateContactStatus } from './actions';
import { CONTACT_STATUSES } from '@/lib/schema';
import { titleCase } from '@/lib/format';

export default function StatusSelect({ contactId, status }) {
  const [current, setCurrent] = useState(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function onChange(e) {
    const next = e.target.value;
    const prev = current;
    setCurrent(next);
    setError('');
    startTransition(async () => {
      const res = await updateContactStatus(contactId, next);
      if (res?.error) {
        setCurrent(prev);
        setError(res.error);
      }
    });
  }

  return (
    <div className={`status-select stage-${current}`}>
      <select value={current} onChange={onChange} disabled={pending}>
        {CONTACT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {titleCase(s)}
          </option>
        ))}
      </select>
      {error && <div className="status-err">{error}</div>}
    </div>
  );
}
