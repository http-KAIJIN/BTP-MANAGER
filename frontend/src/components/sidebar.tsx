'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const navItems = [
  { label: 'Dashboard', href: '/', icon: '▦' },
  { label: 'Companies', href: '/companies', icon: '▤' },
  { label: 'Projects', href: '/projects', icon: '◈' },
  { label: 'Construction', href: '/construction', icon: '◈' },
  { label: 'Suppliers', href: '/suppliers', icon: '◉' },
  { label: 'Intervenants', href: '/intervenants', icon: '◎' },
  { label: 'Commitments', href: '/commitments', icon: '◐' },
  { label: 'Payments', href: '/payments', icon: '◑' },
  { label: 'Expenses', href: '/expenses', icon: '◒' },
  { label: 'Reports', href: '/reports', icon: '▤' },
  { label: 'Admin', href: '/admin', icon: '⚙' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-950">
          BTP Manager
        </Link>
        <p className="mt-0.5 text-xs text-slate-500">Construction ERP</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-2 text-sm font-medium text-slate-700">{user?.fullName}</div>
        <div className="mb-3 text-xs text-slate-500">{user?.email}</div>
        <button
          onClick={logout}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
