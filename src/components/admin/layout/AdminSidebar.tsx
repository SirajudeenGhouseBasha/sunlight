/**
 * AdminSidebar Component
 *
 * Mobile-first sidebar with:
 * - Desktop: fixed 256px left panel
 * - Tablet/Mobile: slide-in drawer triggered by hamburger
 * Requirements: 2.1-2.5, 24.1-24.3
 */

'use client';

import React, { useEffect } from 'react';
import { cn } from '@/src/lib/utils';

const navigation = {
  catalogue: [
    { name: 'Brands',        key: 'brands',        icon: '🏷️' },
    { name: 'Models',        key: 'models',        icon: '📱' },
    { name: 'Variants',      key: 'variants',      icon: '🎨' },
    { name: 'Product Types', key: 'product-types', icon: '📦' },
    { name: 'Predesigned',   key: 'predesigned',   icon: '✨' },
  ],
  operations: [
    { name: 'Users',     key: 'users',     icon: '👥' },
  ],
  design: [
    { name: 'Templates', key: 'templates', icon: '🖼️' },
  ],
};

export interface AdminSidebarProps {
  activeModule?: string;
  onModuleChange?: (moduleKey: string) => void;
  isOpen?: boolean;           // mobile drawer open state
  onClose?: () => void;       // close drawer
  className?: string;
}

export function AdminSidebar({
  activeModule = 'brands',
  onModuleChange,
  isOpen = false,
  onClose,
  className,
}: AdminSidebarProps) {
  // Lock body scroll when mobile drawer is open
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
    onClose?.();           // auto-close drawer on mobile after selection
  };

  const isActive = (key: string) => activeModule === key;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-base">S</span>
          </div>
          <span className="text-lg font-bold text-gray-900">Sunlight</span>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {(
          [
            { label: 'Catalogue',  items: navigation.catalogue  },
            { label: 'Operations', items: navigation.operations },
            { label: 'Design',     items: navigation.design     },
          ] as const
        ).map(({ label, items }) => (
          <div key={label} className="mb-5">
            <p className="px-2 mb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {label}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => handleClick(item.key)}
                    aria-current={isActive(item.key) ? 'page' : undefined}
                    className={cn(
                      'flex items-center w-full gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                      isActive(item.key)
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200',
                    )}
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-green-700">AD</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
            <p className="text-xs text-gray-500 truncate">admin@sunlight.com</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop: fixed sidebar ── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200',
          className,
        )}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile: backdrop + slide-in drawer ── */}
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          'lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Drawer */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
