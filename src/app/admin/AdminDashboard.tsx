/**
 * Admin Dashboard Page
 *
 * Main admin interface for managing the phone case platform
 * Requirements: 11.1 - Admin dashboard and management
 */

import { requireAdmin } from '@/src/lib/auth/session';
import Link from 'next/link';

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col min-h-screen sticky top-0">

        {/* Brand */}
        <div className="px-6 py-7 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 14 14">
                <rect x="1" y="1" width="5" height="5" rx="1"/>
                <rect x="8" y="1" width="5" height="5" rx="1"/>
                <rect x="1" y="8" width="5" height="5" rx="1"/>
                <rect x="8" y="8" width="5" height="5" rx="1"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 leading-none">CaseAdmin</p>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">admin panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-5">

          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 mb-1">Overview</p>
            <NavItem href="/admin" label="Dashboard" icon="dashboard" active />
            <NavItem href="/admin/analytics" label="Analytics" icon="analytics" />
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 mb-1">Catalogue</p>
            <NavItem href="/admin/brands" label="Brands" icon="brands" />
            <NavItem href="/admin/models" label="Models" icon="models" />
            <NavItem href="/admin/product-types" label="Product Types" icon="products" />
            <NavItem href="/admin/variants" label="Variants" icon="variants" />
            <NavItem href="/admin/predesigned" label="Predesigned" icon="predesigned" />
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 mb-1">Operations</p>
            <NavItem href="/admin/orders" label="All Orders" icon="orders" />
            <NavItem href="/admin/orders/pending" label="Pending Orders" icon="pending" />
            <NavItem href="/admin/users" label="Users" icon="users" />
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 mb-1">Design</p>
            <NavItem href="/admin/templates" label="Templates" icon="templates" />
            <NavItem href="/admin/designs" label="User Designs" icon="designs" />
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 mb-1">System</p>
            <NavItem href="/admin/settings" label="Settings" icon="settings" />
          </div>
        </nav>

        {/* User + sign out */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[11px] font-medium text-gray-600 uppercase select-none">
              {user?.email?.[0] ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.email ?? 'Admin'}</p>
              <p className="text-[10px] text-gray-400 font-mono">super_admin</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="flex-1 text-center text-[11px] text-gray-500 border border-gray-200 rounded-md py-1.5 hover:bg-gray-50 transition-colors"
            >
              Dashboard
            </Link>
            <form action="/auth/logout" method="post" className="flex-1">
              <button
                type="submit"
                className="w-full text-[11px] text-gray-500 border border-gray-200 rounded-md py-1.5 hover:bg-gray-50 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-sm font-medium text-gray-900 tracking-tight">Dashboard</h1>
          <Link
            href="/admin/bulk-import"
            className="text-xs bg-gray-900 text-white px-3.5 py-1.5 rounded-md hover:bg-gray-700 transition-colors"
          >
            Bulk Import
          </Link>
        </header>

        <main className="flex-1 px-8 py-7 space-y-5">

          {/* ── Action Panels ── */}
          <div className="grid grid-cols-2 gap-4">

            {/* Brand & Model */}
            <ActionPanel title="Brand & Model" subtitle="catalogue">
              <ActionRow href="/admin/brands" label="Manage Brands" sub="Smartphone manufacturers" />
              <ActionRow href="/admin/models" label="Manage Models" sub="Device listings" />
              <ActionRow href="/admin/bulk-import" label="Bulk Import Models" sub="CSV / spreadsheet upload" highlight />
            </ActionPanel>

            {/* Products */}
            <ActionPanel title="Products" subtitle="types & variants">
              <ActionRow href="/admin/product-types" label="Product Types" sub="Cases, covers, skins" />
              <ActionRow href="/admin/variants" label="Variants & Colors" sub="Material, finish options" />
              <ActionRow href="/admin/predesigned" label="Predesigned Cases" sub="Featured & seasonal" highlight />
            </ActionPanel>

            {/* Orders */}
            <ActionPanel title="Orders" subtitle="operations">
              <ActionRow href="/admin/orders" label="All Orders" sub="Full order history" />
              <ActionRow href="/admin/orders/pending" label="Pending Orders" sub="Awaiting processing" />
            </ActionPanel>

            {/* Users */}
            <ActionPanel title="Users" subtitle="accounts">
              <ActionRow href="/admin/users" label="Manage Users & Roles" sub="Permissions & access levels" />
            </ActionPanel>

            {/* Design */}
            <ActionPanel title="Design" subtitle="templates & uploads">
              <ActionRow href="/admin/templates" label="Templates" sub="Design template library" />
              <ActionRow href="/admin/designs" label="User Designs" sub="Review custom uploads" />
            </ActionPanel>

            {/* System */}
            <ActionPanel title="System" subtitle="configuration">
              <ActionRow href="/admin/settings" label="General Settings" sub="Platform configuration" />
              <ActionRow href="/admin/analytics" label="Analytics" sub="Traffic & sales insights" />
            </ActionPanel>

          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function NavItem({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-6 py-2 text-[13px] transition-colors ${
        active
          ? 'text-gray-900 font-medium bg-gray-50'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <NavIcon name={icon} />
      {label}
    </Link>
  );
}

function NavIcon({ name }: { name: string }) {
  const cls = 'w-3.5 h-3.5 shrink-0 opacity-60';
  const icons: Record<string, React.ReactNode> = {
    dashboard: (
      <svg className={cls} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/>
        <rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/>
      </svg>
    ),
    analytics: (
      <svg className={cls} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="2,10 5,6 7,8 9,4 12,4"/>
      </svg>
    ),
    brands: (
      <svg className={cls} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="10" height="10" rx="1.5"/>
        <line x1="5" y1="5" x2="9" y2="5"/><line x1="5" y1="7" x2="9" y2="7"/><line x1="5" y1="9" x2="7" y2="9"/>
      </svg>
    ),
    models: (
      <svg className={cls} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="1" width="4" height="12" rx="1.5"/>
        <path d="M5 3H3a1 1 0 00-1 1v6a1 1 0 001 1h2"/><path d="M9 3h2a1 1 0 011 1v6a1 1 0 01-1 1H9"/>
      </svg>
    ),
    products: (
      <svg className={cls} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 2h10v10H2z"/><circle cx="7" cy="7" r="2"/>
      </svg>
    ),
    variants: (
      <svg className={cls} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="4" cy="7" r="2"/><circle cx="10" cy="4" r="2"/><circle cx="10" cy="10" r="2"/>
        <line x1="6" y1="6.2" x2="8.2" y2="5.1"/><line x1="6" y1="7.8" x2="8.2" y2="8.9"/>
      </svg>
    ),
    predesigned: (
      <svg className={cls} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 2l1.2 3.5H12l-3 2.2 1.2 3.5L7 9l-3.2 2.2 1.2-3.5L2 5.5h3.8z"/>
      </svg>
    ),
    orders: (
      <svg className={cls} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 3h10l-1 8H3L2 3z"/><path d="M5 3V2a2 2 0 014 0v1"/>
      </svg>
    ),
    pending: (
      <svg className={cls} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7" cy="7" r="5"/><polyline points="7,4 7,7 9,8"/>
      </svg>
    ),
    users: (
      <svg className={cls} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7" cy="5" r="3"/><path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4"/>
      </svg>
    ),
    templates: (
      <svg className={cls} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="10" height="10" rx="1"/><line x1="2" y1="5" x2="12" y2="5"/>
        <line x1="7" y1="5" x2="7" y2="12"/>
      </svg>
    ),
    designs: (
      <svg className={cls} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 12l2-2 7-7-2-2-7 7-2 2z"/><line x1="9" y1="3" x2="11" y2="5"/>
      </svg>
    ),
    settings: (
      <svg className={cls} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7" cy="7" r="2"/>
        <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.9 2.9l1.4 1.4M9.7 9.7l1.4 1.4M2.9 11.1l1.4-1.4M9.7 4.3l1.4-1.4"/>
      </svg>
    ),
  };
  return <>{icons[name] ?? null}</>;
}

function ActionPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-900">{title}</span>
        <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded">{subtitle}</span>
      </div>
      <div className="p-3 space-y-0.5">{children}</div>
    </div>
  );
}

function ActionRow({
  href,
  label,
  sub,
  highlight = false,
}: {
  href: string;
  label: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg group transition-colors ${
        highlight ? 'hover:bg-gray-900' : 'hover:bg-gray-50'
      }`}
    >
      <div>
        <p className={`text-xs font-medium transition-colors ${highlight ? 'text-gray-900 group-hover:text-white' : 'text-gray-800'}`}>
          {label}
        </p>
        <p className={`text-[11px] mt-0.5 transition-colors ${highlight ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400'}`}>
          {sub}
        </p>
      </div>
      <span className={`text-sm transition-colors ${highlight ? 'text-gray-300 group-hover:text-white' : 'text-gray-300 group-hover:text-gray-600'}`}>›</span>
    </Link>
  );
}
