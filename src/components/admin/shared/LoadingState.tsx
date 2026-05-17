/**
 * LoadingState Component
 * 
 * Reusable loading indicator component for displaying loading states
 * Used by DataTable and other components during data fetching
 */

'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

export interface LoadingStateProps {
  message?: string;
  className?: string;
  rows?: number;
  showSkeleton?: boolean;
}

export function LoadingState({
  message = "Loading...",
  className,
  rows = 3,
  showSkeleton = true,
}: LoadingStateProps) {
  if (showSkeleton) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex space-x-4">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4",
      className
    )}>
      {/* Spinner */}
      <div className="mb-4">
        <svg
          className="animate-spin h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>

      {/* Message */}
      <p className="text-gray-600 text-sm">
        {message}
      </p>
    </div>
  );
}