/**
 * AdminContentArea Component
 *
 * Scrollable content wrapper with mobile-friendly padding.
 * Requirements: 2.3, 3.3-3.5
 */

'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

export interface AdminContentAreaProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminContentArea({ children, className }: AdminContentAreaProps) {
  return (
    <main className={cn('flex-1 bg-gray-50 overflow-y-auto', className)}>
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </main>
  );
}
