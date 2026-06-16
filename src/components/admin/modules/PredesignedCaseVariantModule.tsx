/**
 * PredesignedCaseVariantModule Component
 *
 * List view module for managing predesigned case variants.
 * Replaces the ComingSoonPlaceholder for the "Predesigned Case" sidebar item.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 17.1, 17.2, 17.3, 19.1, 19.2
 *
 * Production-grade implementation with:
 * - Debounced search (300ms)
 * - Pagination via useDataTable hook
 * - Row-level Edit and Delete actions
 * - Bulk select with bulk delete
 * - Empty state
 * - Modal wiring for PredesignedCaseModal (Task 5)
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { useToast } from '@/src/components/admin/shared/Toast';
import { useDataTable } from '@/src/hooks/useDataTable';
import { ProductionDataTable, Column } from '@/src/components/ui/productionDataTable';
import { PredesignedCaseModal } from '@/src/components/admin/modals/PredesignedCaseModal';
import { toProxiedUrl } from '@/src/utils/image-url';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PredesignedVariant {
  id: string;
  color_name: string;
  color_hex: string;
  price_modifier?: number;
  model?: {
    id: string;
    name: string;
    brand?: { id: string; name: string };
  };
  product_type?: {
    id: string;
    name: string;
    base_price?: number;
  };
}

export interface PredesignedDesign {
  id: string;
  name: string;
  image_url?: string;
  thumbnail_url?: string;
}

export interface PredesignedCaseVariant {
  id: string;
  variant_id: string;
  case_type: 'custom' | 'predesigned';
  name: string;
  description?: string;
  price_override?: number;
  color_name: string;
  color_hex: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  final_price?: number;
  // Flat image fields (new schema)
  design_image_url?: string;
  variant_image_url?: string;
  additional_image_urls?: string[];
  // Direct FK fields (new schema)
  brand_id?: string;
  model_id?: string;
  product_type_id?: string;
  brand?: { id: string; name: string };
  model?: { id: string; name: string };
  product_type?: { id: string; name: string; base_price?: number };
  // Legacy nested fields (kept for backwards compat)
  variant?: PredesignedVariant;
  design?: PredesignedDesign;
}

// ---------------------------------------------------------------------------
// API helpers — mirrors the pattern from CustomCaseVariantModule
// ---------------------------------------------------------------------------

async function fetchPredesignedCaseVariants(options: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  // The /api/predesigned endpoint returns all records (no server-side pagination).
  // We pass active=false to get all records (active + inactive) for admin management.
  const params = new URLSearchParams({ active: 'false' });

  const response = await fetch(`/api/predesigned?${params}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to fetch predesigned case variants`
    );
  }

  const data = await response.json();
  let items: PredesignedCaseVariant[] = data.predesigned_products || [];

  // Client-side search filtering
  const search = options.search?.trim().toLowerCase();
  if (search) {
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        (item.description && item.description.toLowerCase().includes(search))
    );
  }

  // Client-side sorting
  if (options.sortBy) {
    const key = options.sortBy as keyof PredesignedCaseVariant;
    const dir = options.sortOrder === 'desc' ? -1 : 1;
    items = [...items].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string' && typeof bv === 'string') {
        return av.localeCompare(bv) * dir;
      }
      return ((av as number) - (bv as number)) * dir;
    });
  }

  // Client-side pagination
  const total = items.length;
  const page = options.page || 1;
  const limit = options.limit || 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageItems = items.slice(start, start + limit);

  return {
    items: pageItems,
    pagination: { page, limit, total, totalPages },
  };
}

async function createPredesignedCaseVariant(
  data: Omit<PredesignedCaseVariant, 'id' | 'created_at'>
) {
  const response = await fetch('/api/predesigned', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to create predesigned case variant`
    );
  }

  return await response.json().then((res) => res.predesigned_product);
}

async function updatePredesignedCaseVariant(
  id: string,
  data: Partial<PredesignedCaseVariant>
) {
  const response = await fetch(`/api/predesigned/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to update predesigned case variant`
    );
  }

  return await response.json().then((res) => res.predesigned_product);
}

async function deletePredesignedCaseVariant(id: string) {
  const response = await fetch(`/api/predesigned/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to delete predesigned case variant`
    );
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PredesignedCaseVariantModule() {
  const { showToast } = useToast();

  // Production-grade data table hook
  const table = useDataTable<PredesignedCaseVariant>({
    fetchFn: fetchPredesignedCaseVariants,
    createFn: createPredesignedCaseVariant,
    updateFn: updatePredesignedCaseVariant,
    deleteFn: deletePredesignedCaseVariant,
    pageSize: 10,
    debounceMs: 300,
    retryAttempts: 3,
    syncIntervalMs: 30000,
    enableOfflineCache: true,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<PredesignedCaseVariant | null>(null);

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

  const handleEditVariant = useCallback((variant: PredesignedCaseVariant) => {
    setEditingVariant(variant);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingVariant(null);
  }, []);

  const handleDeleteVariant = useCallback(
    async (variant: PredesignedCaseVariant) => {
      if (
        !window.confirm(
          `Are you sure you want to delete "${variant.name}"? This action cannot be undone.`
        )
      ) {
        return;
      }

      const success = await table.remove(variant.id);
      if (success) {
        handleShowToast('Predesigned case variant deleted successfully', 'success');
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(variant.id);
          return next;
        });
      } else {
        handleShowToast('Failed to delete predesigned case variant', 'error');
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

  const columns: Column<PredesignedCaseVariant>[] = useMemo(
    () => [
      {
        key: 'design_image_url',
        label: 'Image',
        width: '80px',
        render: (value: string, row: PredesignedCaseVariant) => {
          const imageUrl = value || row.variant_image_url || row.design?.thumbnail_url || row.design?.image_url;
          return imageUrl ? (
            <img
              src={toProxiedUrl(imageUrl)}
              alt={`${row.name} thumbnail`}
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
          );
        },
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
      },
      {
        key: 'variant',
        label: 'Base Variant',
        render: (value: PredesignedVariant) => (
          <span className="text-sm text-gray-700">
            {value ? `${value.model?.name || 'N/A'} — ${value.color_name || 'N/A'}` : 'N/A'}
          </span>
        ),
      },
      {
        key: 'color',
        label: 'Color',
        render: (_value: unknown, row: PredesignedCaseVariant) =>
          row.variant ? (
            <div className="flex items-center space-x-2">
              <div
                className="w-5 h-5 rounded border border-gray-200 flex-shrink-0"
                style={{ backgroundColor: row.variant.color_hex }}
                title={row.variant.color_hex}
                aria-label={`Color swatch: ${row.variant.color_hex}`}
              />
              <span className="text-sm text-gray-700">{row.variant.color_name}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">N/A</span>
          ),
      },
      {
        key: 'price_override',
        label: 'Price',
        align: 'right' as const,
        render: (value: number, row: PredesignedCaseVariant) => (
          <span className="text-sm text-gray-700">
            {value != null ? `₹${value.toFixed(2)}` : row.final_price != null ? `₹${row.final_price.toFixed(2)}` : 'Base price'}
          </span>
        ),
      },
      {
        key: 'is_featured',
        label: 'Featured',
        render: (value: boolean) =>
          value ? (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Featured
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              —
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
      {
        key: 'display_order',
        label: 'Display Order',
        align: 'center' as const,
        sortable: true,
        render: (value: number) => (
          <span className="text-sm font-medium text-gray-700">{value}</span>
        ),
      },
    ],
    []
  );

  // ------------------------------------------------------------------
  // Empty state messaging
  // ------------------------------------------------------------------

  const emptyMessage = table.searchQuery
    ? 'No predesigned case variants found matching your search'
    : 'No predesigned case variants yet';

  const emptySubMessage = table.searchQuery
    ? 'Try a different search term'
    : 'Click "Add Predesigned Case" to create your first one';

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
            placeholder="Search predesigned cases by name or description..."
            disabled={table.isLoading}
          />
        </div>
        <button
          onClick={handleOpenAddModal}
          disabled={table.isPerformingAction}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Add new predesigned case variant"
        >
          <span aria-hidden="true">+</span> Add Predesigned Case
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

      {/* Modal */}
      <PredesignedCaseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        variant={editingVariant}
        onSaved={handleModalSaved}
      />
    </div>
  );
}
