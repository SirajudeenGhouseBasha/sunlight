/**
 * ProductionDataTable Component
 *
 * Enterprise-grade table with:
 * - Optimized rendering (memoization, virtualization-ready)
 * - Accessibility (ARIA labels, keyboard navigation)
 * - Responsive design (mobile-first)
 * - Sorting and filtering
 * - Selection and bulk actions
 * - Error handling and retry logic
 * - Loading states
 * - Empty states
 * - Sticky headers
 * - Type-safe column definitions
 *
 * Requirements: Production-grade ERP table
 */

'use client';

import React, { useMemo, useCallback, memo } from 'react';
import { ChevronUp, ChevronDown, AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/src/lib/utils';

/**
 * Column definition for the table
 */
export interface Column<T = any> {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  className?: string;
}

/**
 * Props for ProductionDataTable
 */
export interface ProductionDataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  isSearching?: boolean;
  isPerformingAction?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
  onEdit?: (item: T, index: number) => void;
  onDelete?: (item: T, index: number) => void;
  onRetry?: () => void;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onBulkDelete?: (ids: string[]) => void;
  showSerialNumber?: boolean;
  stickyHeader?: boolean;
  className?: string;
  rowClassName?: string;
  headerClassName?: string;
  minHeight?: string;
}

/**
 * Loading skeleton for table rows
 */
const TableSkeleton = memo(({ columns, count = 5 }: { columns: Column[]; count?: number }) => (
  <tbody>
    {Array.from({ length: count }).map((_, rowIdx) => (
      <tr key={`skeleton-${rowIdx}`} className="border-b border-gray-200 animate-pulse">
        {Array.from({ length: columns.length }).map((_, colIdx) => (
          <td key={`skeleton-cell-${colIdx}`} className="py-3 px-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
));
TableSkeleton.displayName = 'TableSkeleton';

/**
 * Empty state component
 */
const EmptyState = memo(
  ({
    message,
    subMessage,
    icon = '📋',
    colSpan,
  }: {
    message: string;
    subMessage?: string;
    icon?: string;
    colSpan: number;
  }) => (
    <tbody>
      <tr>
        <td colSpan={colSpan} className="py-12 px-4 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="text-4xl mb-3">{icon}</div>
            <p className="text-gray-700 font-medium">{message}</p>
            {subMessage && <p className="text-gray-500 text-sm mt-1">{subMessage}</p>}
          </div>
        </td>
      </tr>
    </tbody>
  )
);
EmptyState.displayName = 'EmptyState';

/**
 * Error state component
 */
const ErrorState = memo(
  ({
    message,
    onRetry,
    colSpan,
  }: {
    message: string;
    onRetry?: () => void;
    colSpan: number;
  }) => (
    <tbody>
      <tr>
        <td colSpan={colSpan} className="py-8 px-4">
          <div className="flex items-center justify-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 text-sm font-medium">{message}</p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors flex-shrink-0"
                aria-label="Retry loading data"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  )
);
ErrorState.displayName = 'ErrorState';

/**
 * Table header cell with sort indicator
 */
const TableHeaderCell = memo(
  ({
    column,
    sortBy,
    sortOrder,
    onSort,
    isSelected,
    onSelectAll,
    showCheckbox,
  }: {
    column: Column;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (key: string, order: 'asc' | 'desc') => void;
    isSelected?: boolean;
    onSelectAll?: (selected: boolean) => void;
    showCheckbox?: boolean;
  }) => {
    const isSorted = sortBy === column.key;
    const canSort = column.sortable && onSort;

    const handleClick = useCallback(() => {
      if (!canSort) return;
      const newOrder =
        isSorted && sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(column.key, newOrder);
    }, [canSort, isSorted, sortOrder, column.key, onSort]);

    return (
      <th
        className={cn(
          'py-3 px-4 text-left font-semibold text-sm text-gray-700 bg-gray-50 border-b border-gray-200',
          canSort && 'cursor-pointer hover:bg-gray-100 transition-colors',
          column.align === 'center' && 'text-center',
          column.align === 'right' && 'text-right',
          column.className
        )}
        onClick={handleClick}
        style={column.width ? { width: column.width } : {}}
        role={canSort ? 'button' : 'columnheader'}
        tabIndex={canSort ? 0 : -1}
        aria-sort={
          isSorted
            ? sortOrder === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none'
        }
        onKeyDown={(e) => {
          if (canSort && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="flex items-center gap-2">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={(e) => onSelectAll?.(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
              aria-label="Select all rows"
            />
          )}
          <span>{column.label}</span>
          {canSort && isSorted && (
            <span className="flex-shrink-0">
              {sortOrder === 'asc' ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </span>
          )}
        </div>
      </th>
    );
  }
);
TableHeaderCell.displayName = 'TableHeaderCell';

/**
 * Table row component
 */
const TableRow = memo(
  ({
    item,
    index,
    columns,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
    showCheckbox,
    showSerialNumber,
    rowClassName,
  }: {
    item: any;
    index: number;
    columns: Column[];
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    onEdit?: (item: any, index: number) => void;
    onDelete?: (item: any, index: number) => void;
    showCheckbox?: boolean;
    showSerialNumber?: boolean;
    rowClassName?: string;
  }) => {
    const handleSelectChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onSelect?.(item.id, e.target.checked);
      },
      [item.id, onSelect]
    );

    const renderCell = useCallback(
      (column: Column) => {
        const value = item[column.key];
        if (column.render) {
          return column.render(value, item, index);
        }
        if (value === null || value === undefined) {
          return <span className="text-gray-400 italic">—</span>;
        }
        return String(value);
      },
      [item, index]
    );

    return (
      <tr
        className={cn(
          'border-b border-gray-200 hover:bg-gray-50 transition-colors',
          isSelected && 'bg-blue-50',
          rowClassName
        )}
      >
        {showCheckbox && (
          <td className="py-3 px-4 w-10">
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={handleSelectChange}
              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
              aria-label={`Select row ${index + 1}`}
            />
          </td>
        )}
        {showSerialNumber && (
          <td className="py-3 px-4 text-sm text-gray-500 font-medium w-12">
            {index + 1}
          </td>
        )}
        {columns.map((column) => (
          <td
            key={column.key}
            className={cn(
              'py-3 px-4 text-sm text-gray-700',
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right',
              column.className
            )}
            style={column.width ? { width: column.width } : {}}
          >
            {renderCell(column)}
          </td>
        ))}
        {(onEdit || onDelete) && (
          <td className="py-3 px-4 text-right">
            <div className="flex items-center justify-end gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(item, index)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                  aria-label={`Edit row ${index + 1}`}
                  title="Edit"
                >
                  ✎
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(item, index)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  aria-label={`Delete row ${index + 1}`}
                  title="Delete"
                >
                  ✕
                </button>
              )}
            </div>
          </td>
        )}
      </tr>
    );
  }
);
TableRow.displayName = 'TableRow';

/**
 * Main ProductionDataTable Component
 */
export const ProductionDataTable = memo(
  React.forwardRef<HTMLTableElement, ProductionDataTableProps>(
    (
      {
        columns,
        data,
        isLoading = false,
        isSearching = false,
        isPerformingAction = false,
        error = null,
        isEmpty = false,
        emptyMessage = 'No data available',
        emptySubMessage = undefined,
        onEdit,
        onDelete,
        onRetry,
        onSort,
        sortBy,
        sortOrder,
        selectable = false,
        selectedIds = new Set(),
        onSelectionChange,
        onBulkDelete,
        showSerialNumber = true,
        stickyHeader = false,
        className,
        rowClassName,
        headerClassName,
        minHeight = '400px',
      },
      ref
    ) => {
      // Calculate column count for empty/error states
      const colSpan = useMemo(() => {
        let count = columns.length;
        if (showSerialNumber) count++;
        if (selectable) count++;
        if (onEdit || onDelete) count++;
        return count;
      }, [columns.length, showSerialNumber, selectable, onEdit, onDelete]);

      // Handle select all
      const handleSelectAll = useCallback(
        (selected: boolean) => {
          if (selected) {
            const allIds = new Set(data.map((item) => item.id));
            onSelectionChange?.(allIds);
          } else {
            onSelectionChange?.(new Set());
          }
        },
        [data, onSelectionChange]
      );

      // Handle individual row selection
      const handleSelectRow = useCallback(
        (id: string, selected: boolean) => {
          const newSelection = new Set(selectedIds);
          if (selected) {
            newSelection.add(id);
          } else {
            newSelection.delete(id);
          }
          onSelectionChange?.(newSelection);
        },
        [selectedIds, onSelectionChange]
      );

      // Check if all rows are selected
      const isAllSelected = useMemo(() => {
        return data.length > 0 && data.every((item) => selectedIds.has(item.id));
      }, [data, selectedIds]);

      // Render table body
      const renderTableBody = useCallback(() => {
        if (error) {
          return <ErrorState message={error} onRetry={onRetry} colSpan={colSpan} />;
        }

        if (isLoading) {
          return <TableSkeleton columns={columns} count={5} />;
        }

        if (isEmpty || data.length === 0) {
          return (
            <EmptyState
              message={emptyMessage}
              subMessage={emptySubMessage}
              colSpan={colSpan}
            />
          );
        }

        return (
          <tbody>
            {data.map((item, index) => (
              <TableRow
                key={item.id ?? index}
                item={item}
                index={index}
                columns={columns}
                isSelected={selectedIds.has(item.id)}
                onSelect={selectable ? handleSelectRow : undefined}
                onEdit={onEdit}
                onDelete={onDelete}
                showCheckbox={selectable}
                showSerialNumber={showSerialNumber}
                rowClassName={rowClassName}
              />
            ))}
          </tbody>
        );
      }, [
        error,
        isLoading,
        isEmpty,
        data,
        columns,
        colSpan,
        emptyMessage,
        emptySubMessage,
        selectedIds,
        selectable,
        handleSelectRow,
        onEdit,
        onDelete,
        showSerialNumber,
        rowClassName,
        onRetry,
      ]);

      return (
        <div
          className={cn('w-full overflow-x-auto rounded-lg border border-gray-200', className)}
          style={{ minHeight }}
        >
          <table
            ref={ref}
            className="w-full border-collapse"
            role="grid"
            aria-label="Data table"
          >
            <thead
              className={cn(
                stickyHeader && 'sticky top-0 z-10',
                headerClassName
              )}
            >
              <tr className="bg-gray-50 border-b border-gray-200">
                {selectable && (
                  <th className="py-3 px-4 w-10 bg-gray-50">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {showSerialNumber && (
                  <th className="py-3 px-4 text-left font-semibold text-sm text-gray-700 bg-gray-50 border-b border-gray-200 w-12">
                    S.No
                  </th>
                )}
                {columns.map((column) => (
                  <TableHeaderCell
                    key={column.key}
                    column={column}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSort}
                    showCheckbox={false}
                  />
                ))}
                {(onEdit || onDelete) && (
                  <th className="py-3 px-4 text-right font-semibold text-sm text-gray-700 bg-gray-50 border-b border-gray-200">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            {renderTableBody()}
          </table>

          {/* Bulk action bar */}
          {selectable && selectedIds.size > 0 && (
            <div className="border-t border-gray-200 bg-blue-50 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {selectedIds.size} row{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              {onBulkDelete && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete ${selectedIds.size} selected item(s)? This action cannot be undone.`
                      )
                    ) {
                      onBulkDelete(Array.from(selectedIds));
                    }
                  }}
                  disabled={isPerformingAction}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Delete Selected
                </button>
              )}
            </div>
          )}
        </div>
      );
    }
  )
);

ProductionDataTable.displayName = 'ProductionDataTable';
