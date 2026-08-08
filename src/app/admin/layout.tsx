/**
 * Admin Layout
 *
 * Shared shell for all admin routes: sidebar + header + scrollable content.
 * Real URLs mean every admin section is deep-linkable and the browser
 * back/forward buttons work across modules.
 */

'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/src/components/admin/layout/AdminSidebar';
import { AdminHeader } from '@/src/components/admin/layout/AdminHeader';
import { AdminContentArea } from '@/src/components/admin/layout/AdminContentArea';
import { ToastProvider } from '@/src/components/admin/shared/Toast';

const pageMeta: Record<string, { title: string; description: string }> = {
  '/admin': { title: 'Dashboard', description: 'Overview of store operations' },
  '/admin/orders': { title: 'Orders', description: 'View and manage customer orders, verify UPI payments' },
  '/admin/production-orders': { title: 'Production Orders', description: 'Track the production pipeline across all states' },
  '/admin/print-queue': { title: 'Print Queue', description: 'Process and manage pending print jobs' },
  '/admin/brands': { title: 'Brands', description: 'Manage smartphone brands' },
  '/admin/models': { title: 'Models', description: 'Manage phone models' },
  '/admin/product-types': { title: 'Product Types', description: 'Manage product types and base pricing' },
  '/admin/custom-case': { title: 'Custom Designed Case', description: 'Manage custom designed case variants' },
  '/admin/predesigned-case': { title: 'Predesigned Case', description: 'Manage predesigned case variants' },
  '/admin/predesigned': { title: 'Predesigned Catalogue', description: 'Manage the predesigned cases catalogue' },
  '/admin/users': { title: 'Users', description: 'Manage user accounts' },
  '/admin/payment-settings': { title: 'Payment Settings', description: 'Configure UPI payment details (UPI ID, phone, QR code)' },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? pageMeta['/admin'];

  return (
    <ToastProvider>
      {/* Full-height flex container */}
      <div className="flex h-dvh overflow-hidden bg-gray-50">

        {/* Sidebar (desktop fixed + mobile drawer) */}
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main column — offset by sidebar width on desktop */}
        <div className="flex flex-col flex-1 min-w-0 lg:ml-64">

          {/* Sticky top bar */}
          <AdminHeader
            title={meta.title}
            description={meta.description}
            onMenuToggle={() => setSidebarOpen(true)}
          />

          {/* Scrollable content */}
          <AdminContentArea>
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </AdminContentArea>

        </div>
      </div>
    </ToastProvider>
  );
}
