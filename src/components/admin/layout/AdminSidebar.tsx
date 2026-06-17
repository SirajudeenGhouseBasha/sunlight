'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/src/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Tags,
  Smartphone,
  Package,
  Palette,
  Sparkles,
  Users,
  Settings,
  ChevronRight,
  LogOut,
  Home,
} from 'lucide-react';

const navigation = [
  {
    label: 'Orders',
    items: [
      { name: 'Orders', key: 'orders', icon: ShoppingCart },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { name: 'Brands', key: 'brands', icon: Tags },
      { name: 'Models', key: 'models', icon: Smartphone },
    ],
  },
  {
    label: 'Product Types',
    items: [
      { name: 'Product Types', key: 'product-types', icon: Package },
    ],
  },
  {
    label: 'Cases',
    items: [
      { name: 'Custom Designed Case', key: 'custom-case', icon: Palette },
      { name: 'Predesigned Case', key: 'predesigned-case', icon: Sparkles },
    ],
  },
  {
    label: 'Users',
    items: [
      { name: 'Users', key: 'users', icon: Users },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Payment', key: 'payment-settings', icon: Settings },
    ],
  },
];

export interface AdminSidebarProps {
  activeModule?: string;
  onModuleChange?: (moduleKey: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function AdminSidebar({
  activeModule = 'brands',
  onModuleChange,
  isOpen = false,
  onClose,
  className,
}: AdminSidebarProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClick = (key: string) => {
    onModuleChange?.(key);
    onClose?.();
  };

  const isActive = (key: string) => activeModule === key;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo + Brand */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <span className="text-base font-bold text-gray-900">Sunlight</span>
            <span className="hidden sm:inline text-[10px] text-gray-400 ml-1.5 font-medium">Admin</span>
          </div>
        </Link>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map(({ label, items }, sectionIndex) => (
          <React.Fragment key={label}>
            {sectionIndex > 0 && (
              <div className="my-3 pt-3 border-t border-gray-100" />
            )}
            <div className="mb-1">
              <p className="px-3 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                {label}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.key}>
                      <button
                        onClick={() => handleClick(item.key)}
                        aria-current={isActive(item.key) ? 'page' : undefined}
                        className={cn(
                          'flex items-center w-full gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                          isActive(item.key)
                            ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 shadow-sm border border-orange-200'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100',
                        )}
                      >
                        <Icon className={cn(
                          'w-4 h-4 shrink-0',
                          isActive(item.key) ? 'text-orange-600' : 'text-gray-400',
                        )} />
                        <span className="flex-1 text-left">{item.name}</span>
                        {isActive(item.key) && (
                          <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </React.Fragment>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-50 transition-all duration-150"
        >
          <Home className="w-4 h-4 text-gray-400" />
          Back to Store
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-orange-700">AD</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
            <p className="text-[11px] text-gray-400 truncate">admin@sunlight.com</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100',
          className,
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile: backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          'lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Mobile: slide-in drawer */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col',
          'transform transition-transform duration-300 ease-in-out shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
