/**
 * AdminPanelPage Component
 *
 * Main admin SPA — mobile-first layout with slide-in sidebar on small screens.
 * Requirements: 3.1-3.5, 24.1-24.3
 */

'use client';

import React, { useState, useCallback } from 'react';
import { AdminSidebar } from '@/src/components/admin/layout/AdminSidebar';
import { AdminHeader } from '@/src/components/admin/layout/AdminHeader';
import { AdminContentArea } from '@/src/components/admin/layout/AdminContentArea';
import { BrandsModule } from '@/src/components/admin/modules/BrandsModule';
import { ModelsModule } from '@/src/components/admin/modules/ModelsModule';
import { ProductTypesModule } from '@/src/components/admin/modules/ProductTypesModule';
import { UsersModule } from '@/src/components/admin/modules/UsersModule';
import { CustomCaseVariantModule } from '@/src/components/admin/modules/CustomCaseVariantModule';
import { PredesignedCaseVariantModule } from '@/src/components/admin/modules/PredesignedCaseVariantModule';
import { ToastProvider } from '@/src/components/admin/shared/Toast';

const modules = {
  brands: {
    name: 'Brands',
    description: 'Manage smartphone brands',
    component: BrandsModule,
  },
  models: {
    name: 'Models',
    description: 'Manage phone models',
    component: ModelsModule,
  },
  'product-types': {
    name: 'Product Types',
    description: 'Manage product types and base pricing',
    component: ProductTypesModule,
  },
  'custom-case': {
    name: 'Custom Designed Case',
    description: 'Manage custom designed case variants',
    component: CustomCaseVariantModule,
  },
  'predesigned-case': {
    name: 'Predesigned Case',
    description: 'Manage predesigned case variants',
    component: PredesignedCaseVariantModule,
  },
  users: {
    name: 'Users',
    description: 'Manage user accounts',
    component: UsersModule,
  },
} as const;

type ModuleKey = keyof typeof modules;

export default function AdminPanelPage() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('brands');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleModuleChange = useCallback((key: string) => {
    setActiveModule(key as ModuleKey);
  }, []);

  const activeConfig = modules[activeModule];
  const ActiveComponent = activeConfig.component;

  return (
    <ToastProvider>
      {/* Full-height flex container */}
      <div className="flex h-screen overflow-hidden bg-gray-50">

        {/* Sidebar (desktop fixed + mobile drawer) */}
        <AdminSidebar
          activeModule={activeModule}
          onModuleChange={handleModuleChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main column — offset by sidebar width on desktop */}
        <div className="flex flex-col flex-1 min-w-0 lg:ml-64">

          {/* Sticky top bar */}
          <AdminHeader
            title={activeConfig.name}
            description={activeConfig.description}
            onMenuToggle={() => setSidebarOpen(true)}
          />

          {/* Scrollable content */}
          <AdminContentArea>
            <div className="max-w-7xl mx-auto">
              <ActiveComponent />
            </div>
          </AdminContentArea>

        </div>
      </div>
    </ToastProvider>
  );
}
