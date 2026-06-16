/**
 * ProductTypesModule Component
 * 
 * Product Types management module with CRUD operations
 * Requirements: 13.1-13.9 - Product types module specifications
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Modal } from '@/src/components/admin/shared/Modal';
import { ProductionDataTable, Column } from '@/src/components/ui/productionDataTable';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { ProductTypeForm } from '@/src/components/admin/forms/ProductTypeForm';
import { useToast } from '@/src/components/admin/shared/Toast';
import { useDataTable } from '@/src/hooks/useDataTable';

// Product type type
export interface ProductType {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  is_active: boolean;
  created_at: string;
}

/**
 * Fetch function to retrieve product types from API
 */
async function fetchProductTypes(options: any) {
  const params = new URLSearchParams({
    page: options.page?.toString() || '1',
    limit: options.limit?.toString() || '10',
    search: options.search || '',
    ...(options.sortBy && { sortBy: options.sortBy }),
    ...(options.sortOrder && { sortOrder: options.sortOrder }),
  });

  const response = await fetch(`/api/product-types?${params}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to fetch product types`
    );
  }

  const data = await response.json();

  return {
    items: data.product_types || [],
    pagination: {
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 10,
      total: data.pagination?.total || 0,
      totalPages: data.pagination?.totalPages || 0,
    },
  };
}

/**
 * Create function for new product type
 */
async function createProductType(data: Omit<ProductType, 'id' | 'created_at'>) {
  const response = await fetch('/api/product-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to create product type`
    );
  }

  return await response.json().then((res) => res.product_type);
}

/**
 * Update function for product type
 */
async function updateProductType(id: string, data: Partial<ProductType>) {
  const response = await fetch(`/api/product-types/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to update product type`
    );
  }

  return await response.json().then((res) => res.product_type);
}

/**
 * Delete function for product type
 */
async function deleteProductType(id: string) {
  const response = await fetch(`/api/product-types/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to delete product type`
    );
  }
}

/**
 * Main ProductTypesModule Component
 */
export function ProductTypesModule() {
  const { showToast } = useToast();

  // Use the production-grade data table hook
  const table = useDataTable<ProductType>({
    fetchFn: fetchProductTypes,
    createFn: createProductType,
    updateFn: updateProductType,
    deleteFn: deleteProductType,
    pageSize: 10,
    debounceMs: 300,
    retryAttempts: 3,
    syncIntervalMs: 30000,
    enableOfflineCache: false,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);

  // Handle create/edit product type
  const handleSaveProductType = async (formData: Omit<ProductType, 'id' | 'created_at'>) => {
    try {
      let result;

      if (editingProductType) {
        result = await table.update(editingProductType.id, formData);
        if (result) {
          showToast('Product type updated successfully', 'success');
        } else {
          showToast('Failed to update product type', 'error');
        }
      } else {
        result = await table.create(formData);
        if (result) {
          showToast('Product type created successfully', 'success');
        } else {
          showToast('Failed to create product type', 'error');
        }
      }

      if (result) {
        setIsModalOpen(false);
        setEditingProductType(null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An error occurred';
      showToast(message, 'error');
    }
  };

  // Handle delete with confirmation
  const handleDeleteProductType = async (productType: ProductType) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${productType.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    const success = await table.remove(productType.id);
    if (success) {
      showToast('Product type deleted successfully', 'success');
    } else {
      showToast('Failed to delete product type', 'error');
    }
  };

  // Handle edit
  const handleEditProductType = (productType: ProductType) => {
    setEditingProductType(productType);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProductType(null);
  };

  // Define table columns
  const columns: Column<ProductType>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Product Type Name',
        sortable: true,
      },
      {
        key: 'base_price',
        label: 'Base Price',
        align: 'right',
        render: (value: number) => `₹${value.toFixed(2)}`,
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
        key: 'created_at',
        label: 'Created Date',
        align: 'right',
        render: (value: string) => {
          try {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
          } catch {
            return 'Invalid date';
          }
        },
      },
    ],
    []
  );

  // Determine empty message based on state
  const emptyMessage = table.searchQuery
    ? 'No product types found matching your search'
    : 'No product types created yet';

  const emptySubMessage = table.searchQuery
    ? 'Try a different search term'
    : 'Create your first product type to get started';

  return (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <SearchBar
            value={table.searchQuery}
            onChange={table.handleSearch}
            placeholder="Search product types by name..."
            disabled={table.isLoading}
          />
        </div>
        <button
          onClick={() => {
            setEditingProductType(null);
            setIsModalOpen(true);
          }}
          disabled={table.isPerformingAction}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Add new product type"
        >
          <span>+</span> Add Product Type
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
        onEdit={handleEditProductType}
        onDelete={handleDeleteProductType}
        onRetry={table.retry}
        onSort={table.handleSort}
        sortBy={table.sortBy}
        sortOrder={table.sortOrder}
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
        title={editingProductType ? 'Edit Product Type' : 'Add Product Type'}
        size="md"
      >
        <ProductTypeForm
          productType={editingProductType}
          onSave={handleSaveProductType}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}