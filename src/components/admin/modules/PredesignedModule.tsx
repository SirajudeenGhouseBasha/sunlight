/**
 * PredesignedModule Component
 * 
 * Predesigned cases management module with CRUD operations
 * Requirements: 19.1-19.10 - Predesigned module specifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Modal } from '@/src/components/admin/shared/Modal';
import { DataTable } from '@/src/components/admin/shared/DataTable';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { PredesignedForm } from '@/src/components/admin/forms/PredesignedForm';
import { useToast } from '@/src/components/admin/shared/Toast';

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

// API response type
interface PredesignedResponse {
  predesigned_products: Predesigned[];
}

export function PredesignedModule() {
  const { showToast } = useToast();
  const [predesigned, setPredesigned] = useState<Predesigned[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPredesigned, setEditingPredesigned] = useState<Predesigned | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch predesigned
  const fetchPredesigned = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/predesigned`);
      if (!response.ok) {
        throw new Error('Failed to fetch predesigned');
      }
      const data: PredesignedResponse = await response.json();
      // Filter and paginate client-side since API doesn't support pagination
      let filtered = data.predesigned_products;
      
      if (searchQuery) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      
      if (featuredFilter !== 'all') {
        filtered = filtered.filter(p => (featuredFilter === 'yes') === p.is_featured);
      }
      
      setTotalItems(filtered.length);
      const start = (currentPage - 1) * pageSize;
      setPredesigned(filtered.slice(start, start + pageSize));
    } catch (error) {
      console.error('Error fetching predesigned:', error);
      showToast('Failed to load predesigned', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch variants for dropdown
  const fetchVariants = async () => {
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
  };

  // Fetch designs for dropdown
  const fetchDesigns = async () => {
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
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, featuredFilter]);

  useEffect(() => {
    fetchPredesigned();
    fetchVariants();
    fetchDesigns();
  }, [currentPage, pageSize, searchQuery, featuredFilter]);

  // Handle create/edit predesigned
  const handleSavePredesigned = async (predesignedData: Omit<Predesigned, 'id' | 'created_at'>) => {
    try {
      const url = editingPredesigned 
        ? `/api/predesigned/${editingPredesigned.id}` 
        : '/api/predesigned';
      const method = editingPredesigned ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(predesignedData),
      });

      if (!response.ok) {
        throw new Error('Failed to save predesigned');
      }

      const savedPredesigned: Predesigned = await response.json();
      
      if (editingPredesigned) {
        setPredesigned(predesigned.map(p => p.id === editingPredesigned.id ? savedPredesigned : p));
        showToast('Predesigned updated successfully', 'success');
      } else {
        setPredesigned([...predesigned, savedPredesigned]);
        showToast('Predesigned created successfully', 'success');
      }

      setIsModalOpen(false);
      setEditingPredesigned(null);
      fetchPredesigned();
    } catch (error) {
      console.error('Error saving predesigned:', error);
      showToast('Failed to save predesigned', 'error');
    }
  };

  // Handle delete predesigned
  const handleDeletePredesigned = async (predesignedId: string) => {
    try {
      const response = await fetch(`/api/predesigned/${predesignedId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete predesigned');
      }

      setPredesigned(predesigned.filter(p => p.id !== predesignedId));
      showToast('Predesigned deleted successfully', 'success');
      fetchPredesigned();
    } catch (error) {
      console.error('Error deleting predesigned:', error);
      showToast('Failed to delete predesigned', 'error');
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = (predesignedId: string, predesignedName: string) => {
    if (window.confirm(`Are you sure you want to delete "${predesignedName}"?`)) {
      handleDeletePredesigned(predesignedId);
    }
  };

  // Columns for DataTable
  const columns = [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'description',
      label: 'Description',
    },
    {
      key: 'price_override',
      label: 'Price',
      render: (value: number | undefined) => (value ? `$${value.toFixed(2)}` : 'Variant price'),
    },
    {
      key: 'is_featured',
      label: 'Featured',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
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
    <div className="space-y-6">
      {/* Header with search, filter, and add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search predesigned by name..."
            />
          </div>
          <div className="w-48">
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value as 'all' | 'yes' | 'no')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="all">All Featured</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
        <Button onClick={() => { setEditingPredesigned(null); setIsModalOpen(true); }}>
          Add Predesigned
        </Button>
      </div>

      {/* Predesigned table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={predesigned}
          isLoading={isLoading}
          isEmpty={predesigned.length === 0}
          emptyMessage="No predesigned cases found"
          actions={true}
          onEdit={(predesigned) => { setEditingPredesigned(predesigned); setIsModalOpen(true); }}
          onDelete={(predesigned) => showDeleteConfirmation(predesigned.id, predesigned.name)}
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
        onClose={() => { setIsModalOpen(false); setEditingPredesigned(null); }}
        title={editingPredesigned ? 'Edit Predesigned' : 'Add Predesigned'}
        size="md"
      >
        <PredesignedForm
          predesigned={editingPredesigned}
          variants={variants}
          designs={designs}
          onSave={handleSavePredesigned}
          onCancel={() => { setIsModalOpen(false); setEditingPredesigned(null); }}
        />
      </Modal>
    </div>
  );
}