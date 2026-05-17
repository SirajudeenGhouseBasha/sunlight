/**
 * ProductTypesModule Component
 * 
 * Product Types management module with CRUD operations
 * Requirements: 13.1-13.9 - Product types module specifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Modal } from '@/src/components/admin/shared/Modal';
import { DataTable } from '@/src/components/admin/shared/DataTable';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { ProductTypeForm } from '@/src/components/admin/forms/ProductTypeForm';
import { useToast } from '@/src/components/admin/shared/Toast';

// Product type type
export interface ProductType {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  is_active: boolean;
  created_at: string;
}

// API response type
interface ProductTypesResponse {
  product_types: ProductType[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function ProductTypesModule() {
  const { showToast } = useToast();
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch product types
  const fetchProductTypes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchQuery,
        active: statusFilter === 'all' ? '' : statusFilter === 'active' ? 'true' : 'false',
      });
      const response = await fetch(`/api/product-types?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product types');
      }
      const data: ProductTypesResponse = await response.json();
      setProductTypes(data.product_types);
      setTotalItems(data.pagination?.total ?? 0);
    } catch (error) {
      console.error('Error fetching product types:', error);
      showToast('Failed to load product types', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchProductTypes();
  }, [currentPage, pageSize, searchQuery, statusFilter]);

  // Handle create/edit product type
  const handleSaveProductType = async (productTypeData: Omit<ProductType, 'id' | 'created_at'>) => {
    try {
      const url = editingProductType 
        ? `/api/product-types/${editingProductType.id}` 
        : '/api/product-types';
      const method = editingProductType ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productTypeData),
      });

      if (!response.ok) {
        throw new Error('Failed to save product type');
      }

      const savedProductType: ProductType = await response.json();
      
      if (editingProductType) {
        setProductTypes(productTypes.map(pt => pt.id === editingProductType.id ? savedProductType : pt));
        showToast('Product type updated successfully', 'success');
      } else {
        setProductTypes([...productTypes, savedProductType]);
        showToast('Product type created successfully', 'success');
      }

      setIsModalOpen(false);
      setEditingProductType(null);
      fetchProductTypes();
    } catch (error) {
      console.error('Error saving product type:', error);
      showToast('Failed to save product type', 'error');
    }
  };

  // Handle delete product type
  const handleDeleteProductType = async (productTypeId: string) => {
    try {
      const response = await fetch(`/api/product-types/${productTypeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product type');
      }

      setProductTypes(productTypes.filter(pt => pt.id !== productTypeId));
      showToast('Product type deleted successfully', 'success');
      fetchProductTypes();
    } catch (error) {
      console.error('Error deleting product type:', error);
      showToast('Failed to delete product type', 'error');
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = (productTypeId: string, productTypeName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productTypeName}"?`)) {
      handleDeleteProductType(productTypeId);
    }
  };

  // Columns for DataTable
  const columns = [
    {
      key: 'name',
      label: 'Product Type Name',
    },
    {
      key: 'base_price',
      label: 'Base Price',
      render: (value: number) => `$${value.toFixed(2)}`,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search product types by name..." />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="w-full sm:w-44 rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:border-green-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button
          onClick={() => { setEditingProductType(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto sm:self-end inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors"
        >
          <span>+</span> Add Product Type
        </button>
      </div>

      {/* Product types table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={productTypes}
          isLoading={isLoading}
          isEmpty={productTypes.length === 0}
          emptyMessage="No product types found"
          actions={true}
          onEdit={(productType) => { setEditingProductType(productType); setIsModalOpen(true); }}
          onDelete={(productType) => showDeleteConfirmation(productType.id, productType.name)}
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
        onClose={() => { setIsModalOpen(false); setEditingProductType(null); }}
        title={editingProductType ? 'Edit Product Type' : 'Add Product Type'}
        size="md"
      >
        <ProductTypeForm
          productType={editingProductType}
          onSave={handleSaveProductType}
          onCancel={() => { setIsModalOpen(false); setEditingProductType(null); }}
        />
      </Modal>
    </div>
  );
}