'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';
import { Menu } from 'lucide-react';

export interface AdminHeaderProps {
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
  onMenuToggle?: () => void;
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
        'bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-20',
        className,
      )}
    >
      <button
        onClick={onMenuToggle}
        aria-label="Open navigation menu"
        className="lg:hidden p-2 -ml-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">{title}</h1>
        {description && (
          <p className="text-xs sm:text-sm text-gray-400 truncate hidden sm:block">{description}</p>
        )}
      </div>

      {actionButton && (
        <div className="shrink-0">{actionButton}</div>
      )}
    </header>
  );
}
