/**
 * AdminHeader Component
 *
 * Mobile-first top bar with:
 * - Hamburger menu button (mobile/tablet)
 * - Page title + description
 * Requirements: 2.2, 24.1-24.3
 */

'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

export interface AdminHeaderProps {
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
  onMenuToggle?: () => void;   // triggers mobile sidebar
  className?: string;
}

export function AdminHeader({
  title,
  description,
  actionButton,
  onMenuToggle,
  className,
}: AdminHeaderProps) {
  return (
    <header
      className={cn(
        'bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-20',
        className,
      )}
    >
      {/* Hamburger — mobile/tablet only */}
      <button
        onClick={onMenuToggle}
        aria-label="Open navigation menu"
        className="lg:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors shrink-0"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{title}</h1>
        {description && (
          <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">{description}</p>
        )}
      </div>

      {/* Optional action slot */}
      {actionButton && (
        <div className="shrink-0">{actionButton}</div>
      )}
    </header>
  );
}
