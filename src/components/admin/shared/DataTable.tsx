/**
 * DataTable Component
 *
 * Mobile-first table with horizontal scroll on small screens.
 * Requirements: 4.1-4.11, 24.4
 */

'use client';

import React from 'react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';

export interface DataTableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  actions?: boolean;
  onEdit?: (item: T, index: number) => void;
  onDelete?: (item: T, index: number) => void;
  className?: string;
  rowClassName?: string;
  serialNumber?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available',
  emptyIcon = '📄',
  actions = false,
  onEdit,
  onDelete,
  className,
  rowClassName,
  serialNumber = true,
}: DataTableProps<T>) {
  if (isLoading) return <LoadingState />;
  if (isEmpty || data.length === 0) return <EmptyState message={emptyMessage} icon={emptyIcon} />;

  const renderCell = (col: DataTableColumn<T>, item: T, index: number) => {
    const value = item[col.key];
    if (col.render) return col.render(value, item, index);
    if (value === null || value === undefined) return <span className="text-gray-400">N/A</span>;
    return String(value);
  };

  return (
    /* Outer wrapper enables horizontal scroll on mobile */
    <div className={cn('w-full overflow-x-auto -webkit-overflow-scrolling-touch', className)}>
      <table className="w-full min-w-[600px] border-collapse">
        <thead>
          <tr className="bg-green-600 text-white">
            {serialNumber && (
              <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm whitespace-nowrap w-12">
                S.No
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'text-left py-3 px-3 sm:px-4 font-medium text-sm whitespace-nowrap',
                  col.width && `w-[${col.width}]`,
                )}
              >
                {col.label}
              </th>
            ))}
            {actions && (
              <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm whitespace-nowrap">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.id ?? index}
              className={cn(
                'border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors',
                rowClassName,
              )}
            >
              {serialNumber && (
                <td className="py-3 px-3 sm:px-4 text-sm text-gray-500">{index + 1}</td>
              )}
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-3 sm:px-4 text-sm text-gray-700">
                  {renderCell(col, item, index)}
                </td>
              ))}
              {actions && (
                <td className="py-3 px-3 sm:px-4">
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <Button
                        onClick={() => onEdit(item, index)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        aria-label="Edit"
                      >
                        Edit
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        onClick={() => onDelete(item, index)}
                        variant="destructive"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        aria-label="Delete"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
