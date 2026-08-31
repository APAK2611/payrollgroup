'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Inquiries', exact: true },
  { href: '/admin/people', label: 'People' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/newsletter', label: 'Newsletter' },
];

export default function Nav({ email }) {
  const pathname = usePathname();
  function isActive(link) {
    if (link.exact) return pathname === link.href;
    return pathname === link.href || pathname.startsWith(link.href + '/');
  }
  return (
    <div className="admin-topbar">
      <div className="admin-topbar-inner">
        <div className="admin-title">
          <span className="brand-mark">AP</span>
          <span>Payroll Association CRM</span>
        </div>
        <nav className="admin-nav">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActive(l) ? 'admin-nav-link active' : 'admin-nav-link'}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="admin-user">
          <span className="admin-email">{email}</span>
          <form action="/admin/signout" method="post">
            <button className="btn-ghost" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
