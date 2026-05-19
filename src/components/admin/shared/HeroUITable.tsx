/**
 * HeroUITable Component
 *
 * Pure HTML table with Hero UI Button components for actions.
 * Simple, reliable, and bug-free implementation.
 */

'use client';

import React from 'react';
import { Button, Spinner } from '@heroui/react';

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

export function HeroUITable<T extends Record<string, any>>({
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
  // Loading state - Hero UI Spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner color="success" />
      </div>
    );
  }

  // Empty state
  if (isEmpty || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">{emptyIcon}</div>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const renderCell = (col: DataTableColumn<T>, item: T, index: number) => {
    const value = item[col.key];
    if (col.render) return col.render(value, item, index);
    if (value === null || value === undefined) return <span className="text-gray-400">N/A</span>;
    return String(value);
  };

  return (
    <div className={`w-full overflow-x-auto ${className || ''}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-green-600 text-white">
            {serialNumber && (
              <th className="text-left py-3 px-4 font-semibold text-sm whitespace-nowrap">
                S.No
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left py-3 px-4 font-semibold text-sm whitespace-nowrap"
                style={col.width ? { width: col.width } : {}}
              >
                {col.label}
              </th>
            ))}
            {actions && (
              <th className="text-left py-3 px-4 font-semibold text-sm whitespace-nowrap">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.id ?? index}
              className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${rowClassName || ''}`}
            >
              {serialNumber && (
                <td className="py-3 px-4 text-sm text-gray-500 font-medium">{index + 1}</td>
              )}
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-4 text-sm text-gray-700">
                  {renderCell(col, item, index)}
                </td>
              ))}
              {actions && (
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <Button
                        isIconOnly
                        className="bg-blue-100 text-blue-600 hover:bg-blue-200"
                        size="sm"
                        onPress={() => onEdit(item, index)}
                        aria-label="Edit"
                      >
                        ✎
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        isIconOnly
                        className="bg-red-100 text-red-600 hover:bg-red-200"
                        size="sm"
                        onPress={() => onDelete(item, index)}
                        aria-label="Delete"
                      >
                        ✕
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
