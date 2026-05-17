/**
 * BrandsModule Component
 * 
 * Brands management module with CRUD operations
 * Requirements: 7.1-7.13 - Brands module specifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Modal } from '@/src/components/admin/shared/Modal';
import { DataTable } from '@/src/components/admin/shared/DataTable';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { BrandForm } from '@/src/components/admin/forms/BrandForm';
import { useToast } from '@/src/components/admin/shared/Toast';

// Brand type
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  created_at: string;
}

// API response type
interface BrandsResponse {
  brands: Brand[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function BrandsModule() {
  const { showToast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch brands
  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchQuery,
      });
      const response = await fetch(`/api/brands?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      const data: BrandsResponse = await response.json();
      setBrands(data.brands);
      setTotalItems(data.pagination?.total ?? 0);
    } catch (error) {
      console.error('Error fetching brands:', error);
      showToast('Failed to load brands', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchBrands();
  }, [currentPage, pageSize, searchQuery]);

  // Handle create/edit brand
  const handleSaveBrand = async (brandData: Omit<Brand, 'id' | 'created_at'>) => {
    try {
      const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands';
      const method = editingBrand ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brandData),
      });

      if (!response.ok) {
        throw new Error('Failed to save brand');
      }

      const json = await response.json();
      const savedBrand: Brand = json.brand ?? json;
      
      if (editingBrand) {
        setBrands(brands.map(b => b.id === editingBrand.id ? savedBrand : b));
        showToast('Brand updated successfully', 'success');
      } else {
        setBrands([...brands, savedBrand]);
        showToast('Brand created successfully', 'success');
      }

      setIsModalOpen(false);
      setEditingBrand(null);
      fetchBrands();
    } catch (error) {
      console.error('Error saving brand:', error);
      showToast('Failed to save brand', 'error');
    }
  };

  // Handle delete brand
  const handleDeleteBrand = async (brandId: string) => {
    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete brand');
      }

      setBrands(brands.filter(b => b.id !== brandId));
      showToast('Brand deleted successfully', 'success');
      fetchBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
      showToast('Failed to delete brand', 'error');
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = (brandId: string, brandName: string) => {
    if (window.confirm(`Are you sure you want to delete "${brandName}"?`)) {
      handleDeleteBrand(brandId);
    }
  };

  // Columns for DataTable
  const columns = [
    {
      key: 'logo_url',
      label: 'Brand Name',
      render: (value: string, brand: Brand) => (
        <div className="flex items-center space-x-3">
          {value ? (
            <img
              src={value}
              alt={brand.name}
              className="w-8 h-8 rounded object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {brand.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="font-medium text-gray-900">{brand.name}</span>
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (value: string) => (
        <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
          {value}
        </code>
      ),
    },
    {
      key: 'description',
      label: 'Description',
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search brands by name..." />
        </div>
        <button
          onClick={() => { setEditingBrand(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors"
        >
          <span>+</span> Add Brand
        </button>
      </div>

      {/* Brands table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={brands}
          isLoading={isLoading}
          isEmpty={brands.length === 0}
          emptyMessage="No brands found"
          actions={true}
          onEdit={(brand) => { setEditingBrand(brand); setIsModalOpen(true); }}
          onDelete={(brand) => showDeleteConfirmation(brand.id, brand.name)}
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
        onClose={() => { setIsModalOpen(false); setEditingBrand(null); }}
        title={editingBrand ? 'Edit Brand' : 'Add Brand'}
        size="md"
      >
        <BrandForm
          brand={editingBrand}
          onSave={(data) => {
            // Convert BrandFormData to Brand with slug
            const brandData: Omit<Brand, 'id' | 'created_at'> = {
              name: data.name,
              slug: data.name.toLowerCase().replace(/\s+/g, '-'),
              logo_url: data.logo_url,
              description: data.description,
            };
            handleSaveBrand(brandData);
          }}
          onCancel={() => { setIsModalOpen(false); setEditingBrand(null); }}
        />
      </Modal>
    </div>
  );
}