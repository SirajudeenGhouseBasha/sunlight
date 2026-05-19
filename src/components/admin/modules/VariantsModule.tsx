/**
 * VariantsModule Component
 * 
 * Variants management module with CRUD operations
 * Requirements: 11.1-11.11 - Variants module specifications
 * 
 * Production-grade implementation with:
 * - Optimistic updates
 * - Race condition prevention
 * - Proper error handling and recovery
 * - Debounced search
 * - Automatic pagination adjustment
 * - Retry logic with exponential backoff
 * - Offline cache support
 * - Memory leak prevention
 * - Full accessibility
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Modal } from '@/src/components/admin/shared/Modal';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { VariantForm } from '@/src/components/admin/forms/VariantForm';
import { useToast } from '@/src/components/admin/shared/Toast';
import { useDataTable } from '@/src/hooks/useDataTable';
import { ProductionDataTable, Column } from '@/src/components/ui/productionDataTable';

// Model type
export interface Model {
  id: string;
  name: string;
  brand_id: string;
}

// Product type type
export interface ProductType {
  id: string;
  name: string;
}

// Variant type
export interface Variant {
  id: string;
  name: string;
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
  additional_image_urls?: string[];
  is_active: boolean;
  created_at: string;
}

// VariantForm data type
interface VariantFormData {
  name: string;
  model_id: string;
  product_type_id: string;
  color_name: string;
  color_hex: string;
  price_modifier?: number;
  stock_quantity: number;
  image_url?: string;
  additional_image_urls?: string[];
  is_active: boolean;
}

/**
 * Fetch function to retrieve variants from API
 * Handles pagination, search, and filtering
 */
async function fetchVariants(options: any) {
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
      errorData.error || `HTTP ${response.status}: Failed to fetch variants`
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

/**
 * Create function for new variant
 */
async function createVariant(data: Omit<Variant, 'id' | 'created_at'>) {
  const response = await fetch('/api/variants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to create variant`
    );
  }

  return await response.json().then((res) => res.variant);
}

/**
 * Update function for variant
 */
async function updateVariant(id: string, data: Partial<Variant>) {
  const response = await fetch(`/api/variants/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to update variant`
    );
  }

  return await response.json().then((res) => res.variant);
}

/**
 * Delete function for variant
 */
async function deleteVariant(id: string) {
  const response = await fetch(`/api/variants/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to delete variant`
    );
  }
}

/**
 * Main VariantsModule Component
 */
export function VariantsModule() {
  const { showToast } = useToast();

  // Use the production-grade data table hook
  const table = useDataTable<Variant>({
    fetchFn: fetchVariants,
    createFn: createVariant,
    updateFn: updateVariant,
    deleteFn: deleteVariant,
    pageSize: 10,
    debounceMs: 300,
    retryAttempts: 3,
    syncIntervalMs: 30000,
    enableOfflineCache: true,
  });

  // Additional state for models and product types
  const [models, setModels] = useState<Model[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch models and product types on mount
  React.useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        setModels(data.models || []);
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };

    const fetchProductTypes = async () => {
      try {
        const response = await fetch('/api/product-types');
        if (!response.ok) {
          throw new Error('Failed to fetch product types');
        }
        const data = await response.json();
        setProductTypes(data.product_types || []);
      } catch (error) {
        console.error('Error fetching product types:', error);
      }
    };

    fetchModels();
    fetchProductTypes();
  }, []);

  // Toast notifications for operations
  const handleShowToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      showToast(message, type);
    },
    [showToast]
  );

  // Handle create/edit variant with toast notifications
  const handleSaveVariant = useCallback(
    async (formData: VariantFormData) => {
      try {
        const variantData: Omit<Variant, 'id' | 'created_at'> = {
          ...formData,
          is_active: formData.is_active ?? true,
        };

        let result;

        if (editingVariant) {
          // Update existing variant
          result = await table.update(editingVariant.id, variantData);
          if (result) {
            handleShowToast('Variant updated successfully', 'success');
          } else {
            handleShowToast('Failed to update variant', 'error');
          }
        } else {
          // Create new variant
          result = await table.create(variantData);
          if (result) {
            handleShowToast('Variant created successfully', 'success');
          } else {
            handleShowToast('Failed to create variant', 'error');
          }
        }

        if (result) {
          setIsModalOpen(false);
          setEditingVariant(null);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'An error occurred';
        handleShowToast(message, 'error');
      }
    },
    [editingVariant, table, handleShowToast]
  );

  // Handle delete with confirmation
  const handleDeleteVariant = useCallback(
    async (variant: Variant) => {
      if (
        !window.confirm(
          `Are you sure you want to delete "${variant.name}"? This action cannot be undone.`
        )
      ) {
        return;
      }

      const success = await table.remove(variant.id);
      if (success) {
        handleShowToast('Variant deleted successfully', 'success');
      } else {
        handleShowToast('Failed to delete variant', 'error');
      }
    },
    [table, handleShowToast]
  );

  // Handle bulk delete
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

  // Handle edit
  const handleEditVariant = useCallback((variant: Variant) => {
    setEditingVariant(variant);
    setIsModalOpen(true);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingVariant(null);
  }, []);

  // Define table columns
  const columns: Column<Variant>[] = useMemo(
    () => [
      {
        key: 'image_url',
        label: 'Image',
        width: '80px',
        render: (value: string) => (
          value ? (
            <img
              src={value}
              alt="Variant"
              className="w-10 h-10 rounded object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">No image</span>
            </div>
          )
        ),
      },
      {
        key: 'name',
        label: 'Variant Name',
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
        render: (value: string, variant: Variant) => (
          <div className="flex items-center space-x-2">
            <div
              className="w-6 h-6 rounded border border-gray-200 flex-shrink-0"
              style={{ backgroundColor: variant.color_hex }}
              title={variant.color_hex}
            />
            <span className="text-sm text-gray-700">{value}</span>
          </div>
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
        key: 'stock_quantity',
        label: 'Stock',
        align: 'center',
        render: (value: number) => (
          <span className="text-sm font-medium text-gray-700">{value}</span>
        ),
      },
      {
        key: 'is_active',
        label: 'Status',
        render: (value: boolean) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              value
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {value ? 'Active' : 'Inactive'}
          </span>
        ),
      },
    ],
    []
  );

  // Determine empty message based on state
  const emptyMessage = table.searchQuery
    ? 'No variants found matching your search'
    : 'No variants created yet';

  const emptySubMessage = table.searchQuery
    ? 'Try a different search term'
    : 'Create your first variant to get started';

  return (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <SearchBar
            value={table.searchQuery}
            onChange={table.handleSearch}
            placeholder="Search variants by name..."
            disabled={table.isLoading}
          />
        </div>
        <button
          onClick={() => {
            setEditingVariant(null);
            setIsModalOpen(true);
          }}
          disabled={table.isPerformingAction}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Add new variant"
        >
          <span>+</span> Add Variant
        </button>
      </div>

      {/* Data table with all production features */}
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

      {/* Pagination component */}
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

      {/* Modal for create/edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingVariant ? 'Edit Variant' : 'Add Variant'}
        size="xl"
      >
        <VariantForm
          variant={editingVariant}
          models={models}
          productTypes={productTypes}
          onSave={handleSaveVariant}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}