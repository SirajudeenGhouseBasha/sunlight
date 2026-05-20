/**
 * CustomCaseVariantModule Component
 *
 * List view module for managing custom case variants.
 * Replaces the ComingSoonPlaceholder for the "Custom Designed Case" sidebar item.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 17.1, 17.2, 17.3, 18.1, 19.1, 19.2
 *
 * Production-grade implementation with:
 * - Debounced search (300ms)
 * - Pagination via useDataTable hook
 * - Row-level Edit and Delete actions
 * - Bulk select with bulk delete
 * - Empty state
 * - Modal wiring for CustomCaseModal (Task 3)
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { useToast } from '@/src/components/admin/shared/Toast';
import { useDataTable } from '@/src/hooks/useDataTable';
import { ProductionDataTable, Column } from '@/src/components/ui/productionDataTable';
import { CustomCaseModal } from '@/src/components/admin/modals/CustomCaseModal';
import { toProxiedUrl } from '@/src/utils/image-url';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Model {
  id: string;
  name: string;
  brand_id: string;
}

export interface ProductType {
  id: string;
  name: string;
}

export interface CustomCaseVariant {
  id: string;
  case_type: 'custom' | 'predesigned';
  name: string;
  description?: string;
  model_id: string;
  model?: Model;
  product_type_id: string;
  product_type?: ProductType;
  color_name: string;
  color_hex: string;
  price_modifier?: number;
  stock_quantity: number;
  image_url?: string;
  mask_image_url?: string;
  is_active: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API helpers — same pattern as VariantsModule
// ---------------------------------------------------------------------------

async function fetchCustomCaseVariants(options: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const params = new URLSearchParams({
    page: options.page?.toString() || '1',
    limit: options.limit?.toString() || '10',
    search: options.search || '',
    ...(options.sortBy && { sortBy: options.sortBy }),
    ...(options.sortOrder && { sortOrder: options.sortOrder }),
  });

  const response = await fetch(`/api/variants?${params}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to fetch custom case variants`
    );
  }

  const data = await response.json();

  return {
    items: data.variants || [],
    pagination: {
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 10,
      total: data.pagination?.total || 0,
      totalPages: data.pagination?.totalPages || 0,
    },
  };
}

async function createCustomCaseVariant(data: Omit<CustomCaseVariant, 'id' | 'created_at'>) {
  const response = await fetch('/api/variants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to create custom case variant`
    );
  }

  return await response.json().then((res) => res.variant);
}

async function updateCustomCaseVariant(id: string, data: Partial<CustomCaseVariant>) {
  const response = await fetch(`/api/variants/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to update custom case variant`
    );
  }

  return await response.json().then((res) => res.variant);
}

async function deleteCustomCaseVariant(id: string) {
  const response = await fetch(`/api/variants/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to delete custom case variant`
    );
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CustomCaseVariantModule() {
  const { showToast } = useToast();

  // Production-grade data table hook
  const table = useDataTable<CustomCaseVariant>({
    fetchFn: fetchCustomCaseVariants,
    createFn: createCustomCaseVariant,
    updateFn: updateCustomCaseVariant,
    deleteFn: deleteCustomCaseVariant,
    pageSize: 10,
    debounceMs: 300,
    retryAttempts: 3,
    syncIntervalMs: 30000,
    enableOfflineCache: true,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<CustomCaseVariant | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------

  const handleShowToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      showToast(message, type);
    },
    [showToast]
  );

  /** Called by the modal after a successful create/edit so the list refreshes. */
  const handleModalSaved = useCallback(() => {
    setIsModalOpen(false);
    setEditingVariant(null);
    table.retry(); // re-fetch current page
  }, [table]);

  const handleOpenAddModal = useCallback(() => {
    setEditingVariant(null);
    setIsModalOpen(true);
  }, []);

  const handleEditVariant = useCallback((variant: CustomCaseVariant) => {
    setEditingVariant(variant);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingVariant(null);
  }, []);

  const handleDeleteVariant = useCallback(
    async (variant: CustomCaseVariant) => {
      if (
        !window.confirm(
          `Are you sure you want to delete "${variant.name}"? This action cannot be undone.`
        )
      ) {
        return;
      }

      const success = await table.remove(variant.id);
      if (success) {
        handleShowToast('Custom case variant deleted successfully', 'success');
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(variant.id);
          return next;
        });
      } else {
        handleShowToast('Failed to delete custom case variant', 'error');
      }
    },
    [table, handleShowToast]
  );

  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      for (const id of ids) {
        await table.remove(id);
      }
      setSelectedIds(new Set());
      handleShowToast(`${ids.length} variant(s) deleted successfully`, 'success');
    },
    [table, handleShowToast]
  );

  // ------------------------------------------------------------------
  // Column definitions
  // ------------------------------------------------------------------

  const columns: Column<CustomCaseVariant>[] = useMemo(
    () => [
      {
        key: 'image_url',
        label: 'Image',
        width: '80px',
        render: (value: string) =>
          value ? (
            <img
              src={toProxiedUrl(value)}
              alt="Variant thumbnail"
              className="w-10 h-10 rounded object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">No img</span>
            </div>
          ),
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
      },
      {
        key: 'model',
        label: 'Model',
        render: (value: Model) => (
          <span className="text-sm text-gray-700">{value?.name || 'N/A'}</span>
        ),
      },
      {
        key: 'product_type',
        label: 'Product Type',
        render: (value: ProductType) => (
          <span className="text-sm text-gray-700">{value?.name || 'N/A'}</span>
        ),
      },
      {
        key: 'color_name',
        label: 'Color',
        render: (value: string, variant: CustomCaseVariant) => (
          <div className="flex items-center space-x-2">
            <div
              className="w-5 h-5 rounded border border-gray-200 flex-shrink-0"
              style={{ backgroundColor: variant.color_hex }}
              title={variant.color_hex}
              aria-label={`Color swatch: ${variant.color_hex}`}
            />
            <span className="text-sm text-gray-700">{value}</span>
          </div>
        ),
      },
      {
        key: 'stock_quantity',
        label: 'Stock',
        align: 'center',
        render: (value: number) => (
          <span className="text-sm font-medium text-gray-700">{value}</span>
        ),
      },
      {
        key: 'price_modifier',
        label: 'Price Modifier',
        align: 'right',
        render: (value: number) => (
          <span className="text-sm text-gray-700">
            {value ? `+$${value.toFixed(2)}` : '$0.00'}
          </span>
        ),
      },
      {
        key: 'is_active',
        label: 'Status',
        render: (value: boolean) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {value ? 'Active' : 'Inactive'}
          </span>
        ),
      },
    ],
    []
  );

  // ------------------------------------------------------------------
  // Empty state messaging
  // ------------------------------------------------------------------

  const emptyMessage = table.searchQuery
    ? 'No custom case variants found matching your search'
    : 'No custom case variants yet';

  const emptySubMessage = table.searchQuery
    ? 'Try a different search term'
    : 'Click "Add Custom Case Variant" to create your first one';

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header: search + add button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <SearchBar
            value={table.searchQuery}
            onChange={table.handleSearch}
            placeholder="Search custom case variants by name..."
            disabled={table.isLoading}
          />
        </div>
        <button
          onClick={handleOpenAddModal}
          disabled={table.isPerformingAction}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Add new custom case variant"
        >
          <span aria-hidden="true">+</span> Add Custom Case Variant
        </button>
      </div>

      {/* Data table */}
      <ProductionDataTable
        columns={columns}
        data={table.items}
        isLoading={table.isLoading}
        isSearching={table.isSearching}
        isPerformingAction={table.isPerformingAction}
        error={table.error}
        isEmpty={table.items.length === 0 && !table.isLoading}
        emptyMessage={emptyMessage}
        emptySubMessage={emptySubMessage}
        onEdit={handleEditVariant}
        onDelete={handleDeleteVariant}
        onRetry={table.retry}
        onSort={table.handleSort}
        sortBy={table.sortBy}
        sortOrder={table.sortOrder}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkDelete={handleBulkDelete}
        showSerialNumber={true}
        stickyHeader={true}
      />

      {/* Pagination */}
      {table.items.length > 0 && (
        <Pagination
          currentPage={table.pagination.page}
          totalPages={table.pagination.totalPages}
          totalItems={table.pagination.total}
          pageSize={table.pagination.limit}
          onPageChange={table.changePage}
          onPageSizeChange={table.changePageSize}
        />
      )}

      {/* Modal — self-contained create/edit modal (Task 3) */}
      <CustomCaseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        variant={editingVariant}
        onSaved={handleModalSaved}
      />
    </div>
  );
}
