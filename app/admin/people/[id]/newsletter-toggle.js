'use client';

import { useState, useTransition } from 'react';
import { setOkToContact } from '../../actions';

export default function NewsletterToggle({ personId, initial }) {
  const [on, setOn] = useState(!!initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const res = await setOkToContact(personId, next);
      if (res?.error) setOn(!next);
    });
  }

  return (
    <button
      type="button"
      className={on ? 'toggle on' : 'toggle'}
      onClick={toggle}
      disabled={pending}
      aria-pressed={on}
    >
      <span className="toggle-knob" />
      <span className="toggle-label">
        {on ? 'Subscribed to newsletter' : 'Not subscribed'}
      </span>
    </button>
  );
}
