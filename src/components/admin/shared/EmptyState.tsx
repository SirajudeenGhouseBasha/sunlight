/**
 * EmptyState Component
 * 
 * Reusable component for displaying no-data scenarios with customizable message and icon
 * Used by DataTable and other components when no data is available
 */

'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

export interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: string;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  message = "No data available",
  description,
  icon = "📄",
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {/* Icon */}
      <div className="text-6xl mb-4 opacity-50">
        {icon}
      </div>

      {/* Message */}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {message}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-gray-600 mb-4 max-w-md">
          {description}
        </p>
      )}

      {/* Custom content */}
      {children}
    </div>
  );
}