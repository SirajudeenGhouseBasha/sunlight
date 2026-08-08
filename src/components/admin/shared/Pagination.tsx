/**
 * Pagination Component
 *
 * Mobile-first pagination:
 * - Mobile: compact Prev/Next + item count on one row
 * - Desktop: full info with page-size selector
 * Requirements: 5.1-5.8, 24.4
 */

'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  className?: string;
  pageSizeOptions?: number[];
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem   = Math.min(currentPage * pageSize, totalItems);
  const isFirst   = currentPage <= 1;
  const isLast    = currentPage >= totalPages || totalPages === 0;

  const navBtn = (label: string, onClick: () => void, disabled: boolean) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-3 py-2 text-sm font-medium rounded-lg border transition-colors min-h-11',
        disabled
          ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white'
          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100',
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      className={cn(
        'border-t border-gray-200 bg-white px-4 py-3',
        className,
      )}
    >
      {/* ── Mobile layout ── */}
      <div className="flex items-center justify-between sm:hidden">
        <span className="text-xs text-gray-500">
          {startItem}–{endItem} of {totalItems}
        </span>
        <div className="flex gap-2">
          {navBtn('← Prev', () => onPageChange(currentPage - 1), isFirst)}
          {navBtn('Next →', () => onPageChange(currentPage + 1), isLast)}
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        {/* Left: count + page-size */}
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{startItem}</span>–
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span>
          </p>

          <div className="flex items-center gap-2">
            <label htmlFor="page-size-select" className="text-sm text-gray-600 whitespace-nowrap">
              Rows:
            </label>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: page nav */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages || 1}</span>
          </span>
          <div className="flex gap-1.5">
            {navBtn('Previous', () => onPageChange(currentPage - 1), isFirst)}
            {navBtn('Next',     () => onPageChange(currentPage + 1), isLast)}
          </div>
        </div>
      </div>
    </div>
  );
}
