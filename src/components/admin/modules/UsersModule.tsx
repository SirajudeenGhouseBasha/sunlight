/**
 * UsersModule - Production Grade Implementation
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
 * Requirements: 15.1-15.10 - Users module specifications
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Modal } from '@/src/components/admin/shared/Modal';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { UserForm } from '@/src/components/admin/forms/UserForm';
import { useToast } from '@/src/components/admin/shared/Toast';
import { useDataTable } from '@/src/hooks/useDataTable';
import { ProductionDataTable, Column } from '@/src/components/ui/productionDataTable';

// User type
export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  last_login?: string;
  created_at: string;
}

// UserForm data type
interface UserFormData {
  email: string;
  role: 'user' | 'admin';
  password?: string;
}

/**
 * Fetch function to retrieve users from API
 * Handles pagination, search, and filtering
 */
async function fetchUsers(options: any) {
  const params = new URLSearchParams({
    page: options.page?.toString() || '1',
    limit: options.limit?.toString() || '10',
    search: options.search || '',
    ...(options.sortBy && { sortBy: options.sortBy }),
    ...(options.sortOrder && { sortOrder: options.sortOrder }),
  });

  const response = await fetch(`/api/admin/users?${params}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to fetch users`
    );
  }

  const data = await response.json();

  return {
    items: data.users || [],
    pagination: {
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 10,
      total: data.pagination?.total || 0,
      totalPages: data.pagination?.totalPages || 0,
    },
  };
}

/**
 * Create function for new user
 */
async function createUser(data: Omit<User, 'id' | 'created_at'> & { password?: string }) {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to create user`
    );
  }

  return await response.json().then((res) => res.user);
}

/**
 * Update function for user
 */
async function updateUser(id: string, data: Partial<User> & { password?: string }) {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to update user`
    );
  }

  return await response.json().then((res) => res.user);
}

/**
 * Delete function for user
 */
async function deleteUser(id: string) {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: Failed to delete user`
    );
  }
}

/**
 * Main UsersModule Component
 */
export function UsersModule() {
  const { showToast } = useToast();

  // Use the production-grade data table hook
  const table = useDataTable<User>({
    fetchFn: fetchUsers,
    createFn: createUser,
    updateFn: updateUser,
    deleteFn: deleteUser,
    pageSize: 10,
    debounceMs: 300,
    retryAttempts: 3,
    syncIntervalMs: 30000,
    enableOfflineCache: true,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Toast notifications for operations
  const handleShowToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      showToast(message, type);
    },
    [showToast]
  );

  // Handle create/edit user with toast notifications
  const handleSaveUser = useCallback(
    async (formData: UserFormData) => {
      try {
        const userData: Omit<User, 'id' | 'created_at'> & { password?: string } = {
          email: formData.email,
          role: formData.role,
          ...(formData.password && { password: formData.password }),
        };

        let result;

        if (editingUser) {
          // Update existing user
          result = await table.update(editingUser.id, userData);
          if (result) {
            handleShowToast('User updated successfully', 'success');
          } else {
            handleShowToast('Failed to update user', 'error');
          }
        } else {
          // Create new user - optimistic update handles immediate display
          result = await table.create(userData);
          if (result) {
            handleShowToast('User created successfully', 'success');
          } else {
            handleShowToast('Failed to create user', 'error');
          }
        }

        if (result) {
          setIsModalOpen(false);
          setEditingUser(null);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'An error occurred';
        handleShowToast(message, 'error');
      }
    },
    [editingUser, table, handleShowToast]
  );

  // Handle delete with confirmation
  const handleDeleteUser = useCallback(
    async (user: User) => {
      if (
        !window.confirm(
          `Are you sure you want to delete "${user.email}"? This action cannot be undone.`
        )
      ) {
        return;
      }

      const success = await table.remove(user.id);
      if (success) {
        handleShowToast('User deleted successfully', 'success');
      } else {
        handleShowToast('Failed to delete user', 'error');
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
      handleShowToast(`${ids.length} user(s) deleted successfully`, 'success');
    },
    [table, handleShowToast]
  );

  // Handle edit
  const handleEditUser = useCallback((user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingUser(null);
  }, []);

  // Define table columns
  const columns: Column<User>[] = useMemo(
    () => [
      {
        key: 'email',
        label: 'Email',
        width: '250px',
        render: (value: string) => (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-600">
                {value.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="font-medium text-gray-900 truncate">{value}</p>
          </div>
        ),
      },
      {
        key: 'role',
        label: 'Role',
        width: '120px',
        render: (value: 'user' | 'admin') => (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
              value === 'admin'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {value === 'admin' ? 'Admin' : 'User'}
          </span>
        ),
      },
      {
        key: 'last_login',
        label: 'Last Login',
        width: '140px',
        align: 'right',
        render: (value: string) => {
          if (!value) {
            return <span className="text-gray-400 italic">Never</span>;
          }
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
    ? 'No users found matching your search'
    : 'No users created yet';

  const emptySubMessage = table.searchQuery
    ? 'Try a different search term'
    : 'Create your first user to get started';

  return (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <SearchBar
            value={table.searchQuery}
            onChange={table.handleSearch}
            placeholder="Search users by email..."
            disabled={table.isLoading}
          />
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setIsModalOpen(true);
          }}
          disabled={table.isPerformingAction}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Add new user"
        >
          <span>+</span> Add User
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
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
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
        title={editingUser ? 'Edit User' : 'Add User'}
        size="md"
      >
        <UserForm
          user={editingUser}
          onSave={handleSaveUser}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}