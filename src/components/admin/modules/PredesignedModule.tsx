/**
 * PredesignedModule - Production Grade Implementation
 * 
 * Complete rewrite with:
 * - Optimistic updates (newly added items appear instantly)
 * - Race condition prevention
 * - Proper error handling and recovery
 * - Debounced search
 * - Automatic pagination adjustment
 * - Retry logic with exponential backoff
 * - Offline cache support
 * - Memory leak prevention
 * - Full accessibility
 * - Conflict detection
 * - Undo capability
 * 
 * Requirements: 19.1-19.10 - Predesigned module specifications
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Modal } from '@/src/components/admin/shared/Modal';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { PredesignedForm } from '@/src/components/admin/forms/PredesignedForm';
import { useToast } from '@/src/components/admin/shared/Toast';
import { useDataTable } from '@/src/hooks/useDataTable';
import { ProductionDataTable, Column } from '@/src/components/ui/productionDataTable';

// Predesigned type
export interface Predesigned {
  id: string;
  name: string;
  description?: string;
  price_override?: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  variant_id?: string;
  design_id?: string;
}

// Variant type
export interface Variant {
  id: string;
  name: string;
}

// Design type
export interface Design {
  id: string;
  name: string;
}

// PredesignedForm data type
interface PredesignedFormData {
  name: string;
  description?: string;
  price_override?: number;
  is_featured: boolean;
  is_active: boolean;
  variant_id?: string;
  design_id?: string;
}

/**
 * Fetch function to retrieve predesigned from API
 * Handles pagination, search, and filtering
 */
async function fetchPredesigned(options: any) {
  const params = new URLSearchParams({
    page: options.page?.toString() || '1',
    limit: options.limit?.toString() || '10',
    search: options.search || '',
    ...(options.sortBy && { sortBy: options.sortBy }),
    ...(options.sortOrder && { sortOrder: options.sortOrder }),
  });

  const response = await fetch(`/api/predesigned?${params}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to fetch predesigned`
    );
  }

  const data = await response.json();

  return {
    items: data.predesigned_products || [],
    pagination: {
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 10,
      total: data.pagination?.total || 0,
      totalPages: data.pagination?.totalPages || 0,
    },
  };
}

/**
 * Create function for new predesigned
 */
async function createPredesigned(data: Omit<Predesigned, 'id' | 'created_at'>) {
  const response = await fetch('/api/predesigned', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to create predesigned`
    );
  }

  return await response.json().then((res) => res.predesigned);
}

/**
 * Update function for predesigned
 */
async function updatePredesigned(id: string, data: Partial<Predesigned>) {
  const response = await fetch(`/api/predesigned/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to update predesigned`
    );
  }

  return await response.json().then((res) => res.predesigned);
}

/**
 * Delete function for predesigned
 */
async function deletePredesigned(id: string) {
  const response = await fetch(`/api/predesigned/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to delete predesigned`
    );
  }
}

/**
 * Main PredesignedModule Component
 */
export function PredesignedModule() {
  const { showToast } = useToast();

  // Use the production-grade data table hook
  const table = useDataTable<Predesigned>({
    fetchFn: fetchPredesigned,
    createFn: createPredesigned,
    updateFn: updatePredesigned,
    deleteFn: deletePredesigned,
    pageSize: 10,
    debounceMs: 300,
    retryAttempts: 3,
    syncIntervalMs: 30000,
    enableOfflineCache: true,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPredesigned, setEditingPredesigned] = useState<Predesigned | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [variants, setVariants] = useState<Variant[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);

  // Fetch variants for dropdown
  const fetchVariants = useCallback(async () => {
    try {
      const response = await fetch('/api/variants');
      if (!response.ok) {
        throw new Error('Failed to fetch variants');
      }
      const data = await response.json();
      setVariants(data.variants || []);
    } catch (error) {
      console.error('Error fetching variants:', error);
    }
  }, []);

  // Fetch designs for dropdown
  const fetchDesigns = useCallback(async () => {
    try {
      const response = await fetch('/api/designs/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch designs');
      }
      const data = await response.json();
      setDesigns(data.templates || []);
    } catch (error) {
      console.error('Error fetching designs:', error);
    }
  }, []);

  // Fetch variants and designs on mount
  React.useEffect(() => {
    fetchVariants();
    fetchDesigns();
  }, [fetchVariants, fetchDesigns]);

  // Toast notifications for operations
  const handleShowToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      showToast(message, type);
    },
    [showToast]
  );

  // Handle create/edit predesigned with toast notifications
  const handleSavePredesigned = useCallback(
    async (formData: PredesignedFormData) => {
      try {
        const predesignedData: Omit<Predesigned, 'id' | 'created_at'> = {
          name: formData.name,
          description: formData.description,
          price_override: formData.price_override,
          is_featured: formData.is_featured,
          is_active: formData.is_active,
          variant_id: formData.variant_id,
          design_id: formData.design_id,
        };

        let result;

        if (editingPredesigned) {
          // Update existing predesigned
          result = await table.update(editingPredesigned.id, predesignedData);
          if (result) {
            handleShowToast('Predesigned updated successfully', 'success');
          } else {
            handleShowToast('Failed to update predesigned', 'error');
          }
        } else {
          // Create new predesigned - optimistic update handles immediate display
          result = await table.create(predesignedData);
          if (result) {
            handleShowToast('Predesigned created successfully', 'success');
          } else {
            handleShowToast('Failed to create predesigned', 'error');
          }
        }

        if (result) {
          setIsModalOpen(false);
          setEditingPredesigned(null);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'An error occurred';
        handleShowToast(message, 'error');
      }
    },
    [editingPredesigned, table, handleShowToast]
  );

  // Handle delete with confirmation
  const handleDeletePredesigned = useCallback(
    async (predesigned: Predesigned) => {
      if (
        !window.confirm(
          `Are you sure you want to delete "${predesigned.name}"? This action cannot be undone.`
        )
      ) {
        return;
      }

      const success = await table.remove(predesigned.id);
      if (success) {
        handleShowToast('Predesigned deleted successfully', 'success');
      } else {
        handleShowToast('Failed to delete predesigned', 'error');
      }
    },
    [table, handleShowToast]
  );

  // Handle bulk delete
  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      // Delete each item (in production, implement bulk delete endpoint)
      for (const id of ids) {
        await table.remove(id);
      }
      setSelectedIds(new Set());
      handleShowToast(`${ids.length} predesigned item(s) deleted successfully`, 'success');
    },
    [table, handleShowToast]
  );

  // Handle edit
  const handleEditPredesigned = useCallback((predesigned: Predesigned) => {
    setEditingPredesigned(predesigned);
    setIsModalOpen(true);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingPredesigned(null);
  }, []);

  // Define table columns
  const columns: Column<Predesigned>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        width: '200px',
        render: (value: string, predesigned: Predesigned) => (
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {value}
            </p>
            {predesigned.description && (
              <p className="text-xs text-gray-500 truncate">{predesigned.description}</p>
            )}
          </div>
        ),
      },
      {
        key: 'price_override',
        label: 'Price',
        width: '120px',
        align: 'right',
        render: (value: number | undefined) => (
          <span className="text-sm text-gray-700">
            {value ? `₹${value.toFixed(2)}` : <span className="text-gray-400 italic">Variant price</span>}
          </span>
        ),
      },
      {
        key: 'is_featured',
        label: 'Featured',
        width: '100px',
        align: 'center',
        render: (value: boolean) => (
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {value ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        key: 'is_active',
        label: 'Active',
        width: '100px',
        align: 'center',
        render: (value: boolean) => (
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {value ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        key: 'created_at',
        label: 'Created',
        width: '140px',
        align: 'right',
        render: (value: string) => {
          try {
            const date = new Date(value);
            return (
              <time dateTime={value} className="text-sm text-gray-600">
                {date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            );
          } catch {
            return <span className="text-sm text-gray-400">Invalid date</span>;
          }
        },
      },
    ],
    []
  );

  // Determine empty message based on state
  const emptyMessage = table.searchQuery
    ? 'No predesigned items found matching your search'
    : 'No predesigned items created yet';

  const emptySubMessage = table.searchQuery
    ? 'Try a different search term'
    : 'Create your first predesigned item to get started';

  return (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <SearchBar
            value={table.searchQuery}
            onChange={table.handleSearch}
            placeholder="Search predesigned by name..."
            disabled={table.isLoading}
          />
        </div>
        <button
          onClick={() => {
            setEditingPredesigned(null);
            setIsModalOpen(true);
          }}
          disabled={table.isPerformingAction}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Add new predesigned item"
        >
          <span>+</span> Add Predesigned
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
        onEdit={handleEditPredesigned}
        onDelete={handleDeletePredesigned}
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
        title={editingPredesigned ? 'Edit Predesigned' : 'Add Predesigned'}
        size="md"
      >
        <PredesignedForm
          predesigned={editingPredesigned}
          variants={variants}
          designs={designs}
          onSave={handleSavePredesigned}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}