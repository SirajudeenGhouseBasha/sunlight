/**
 * UsersModule Component
 * 
 * Users management module with CRUD operations
 * Requirements: 15.1-15.10 - Users module specifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Modal } from '@/src/components/admin/shared/Modal';
import { DataTable } from '@/src/components/admin/shared/DataTable';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { UserForm } from '@/src/components/admin/forms/UserForm';
import { useToast } from '@/src/components/admin/shared/Toast';

// User type
export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  last_login?: string;
  created_at: string;
}

// API response type
interface UsersResponse {
  users: User[];
}

export function UsersModule() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data: UsersResponse = await response.json();
      // Filter and paginate client-side since API doesn't support pagination
      let filtered = data.users;
      
      if (searchQuery) {
        filtered = filtered.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      
      if (roleFilter !== 'all') {
        filtered = filtered.filter(u => u.role === roleFilter);
      }
      
      setTotalItems(filtered.length);
      const start = (currentPage - 1) * pageSize;
      setUsers(filtered.slice(start, start + pageSize));
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, searchQuery, roleFilter]);

  // Handle create/edit user
  const handleSaveUser = async (userData: Omit<User, 'id' | 'created_at'> & { password?: string }) => {
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to save user');
      }

      const json = await response.json();
      const savedUser: User = json.user ?? json;
      
      if (editingUser) {
        setUsers(users.map(u => u.id === editingUser.id ? savedUser : u));
        showToast('User updated successfully', 'success');
      } else {
        setUsers([...users, savedUser]);
        showToast('User created successfully', 'success');
      }

      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      showToast('Failed to save user', 'error');
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(users.filter(u => u.id !== userId));
      showToast('User deleted successfully', 'success');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = (userId: string, userEmail: string) => {
    if (window.confirm(`Are you sure you want to delete "${userEmail}"?`)) {
      handleDeleteUser(userId);
    }
  };

  // Columns for DataTable
  const columns = [
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'role',
      label: 'Role',
      render: (value: 'user' | 'admin') => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value === 'admin' ? 'Admin' : 'User'}
        </span>
      ),
    },
    {
      key: 'last_login',
      label: 'Last Login',
      render: (value: string) => {
        if (!value) return 'Never';
        const date = new Date(value);
        return date.toLocaleDateString();
      },
    },
    {
      key: 'created_at',
      label: 'Created Date',
      render: (value: string) => {
        const date = new Date(value);
        return date.toLocaleDateString();
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search users by email..." />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'user' | 'admin')}
            className="w-full sm:w-44 rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:border-green-500"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto sm:self-end inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors"
        >
          <span>+</span> Add User
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          isEmpty={users.length === 0}
          emptyMessage="No users found"
          actions={true}
          onEdit={(user) => { setEditingUser(user); setIsModalOpen(true); }}
          onDelete={(user) => showDeleteConfirmation(user.id, user.email)}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalItems / pageSize)}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Modal for create/edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
        title={editingUser ? 'Edit User' : 'Add User'}
        size="md"
      >
        <UserForm
          user={editingUser}
          onSave={handleSaveUser}
          onCancel={() => { setIsModalOpen(false); setEditingUser(null); }}
        />
      </Modal>
    </div>
  );
}