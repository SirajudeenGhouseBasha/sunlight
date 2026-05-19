/**
 * ModelsModule Component
 * 
 * Models management module with CRUD operations
 * Requirements: 9.1-9.9 - Models module specifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/src/components/admin/shared/Modal';
import { HeroUITable } from '@/src/components/admin/shared/HeroUITable';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { ModelForm } from '@/src/components/admin/forms/ModelForm';
import { useToast } from '@/src/components/admin/shared/Toast';

// Brand type
export interface Brand {
  id: string;
  name: string;
  slug: string;
}

// Model type
export interface Model {
  id: string;
  name: string;
  brand_id: string;
  brand?: Brand;
  release_year?: number;
  created_at: string;
}

// API response types
interface BrandsResponse {
  brands: Brand[];
}

interface ModelsResponse {
  models: Model[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function ModelsModule() {
  const { showToast } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch models with useCallback to prevent stale closures
  const fetchModels = React.useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchQuery,
        brand_id: brandFilter,
      });
      const response = await fetch(`/api/models?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data: ModelsResponse = await response.json();
      setModels(data.models);
      setTotalItems(data.pagination?.total ?? 0);
    } catch (error) {
      console.error('Error fetching models:', error);
      showToast('Failed to load models', 'error');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, brandFilter, showToast]);

  // Fetch brands for dropdown
  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands');
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      const data: BrandsResponse = await response.json();
      setBrands(data.brands);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, brandFilter]);

  useEffect(() => {
    fetchModels(true);
  }, [fetchModels]);

  // Fetch brands on mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Handle create/edit model
  const handleSaveModel = async (modelData: Omit<Model, 'id' | 'created_at'>) => {
    try {
      const url = editingModel ? `/api/models/${editingModel.id}` : '/api/models';
      const method = editingModel ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modelData),
      });

      if (!response.ok) {
        throw new Error('Failed to save model');
      }

      if (editingModel) {
        showToast('Model updated successfully', 'success');
      } else {
        showToast('Model created successfully', 'success');
      }

      setIsModalOpen(false);
      setEditingModel(null);
      setCurrentPage(1);
      await fetchModels(false);
    } catch (error) {
      console.error('Error saving model:', error);
      showToast('Failed to save model', 'error');
    }
  };

  // Handle delete model
  const handleDeleteModel = async (modelId: string) => {
    try {
      const response = await fetch(`/api/models/${modelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete model');
      }

      showToast('Model deleted successfully', 'success');
      await fetchModels(false);
    } catch (error) {
      console.error('Error deleting model:', error);
      showToast('Failed to delete model', 'error');
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = (modelId: string, modelName: string) => {
    if (window.confirm(`Are you sure you want to delete "${modelName}"?`)) {
      handleDeleteModel(modelId);
    }
  };

  // Columns for DataTable
  const columns = [
    {
      key: 'name',
      label: 'Model Name',
    },
    {
      key: 'brand',
      label: 'Brand',
      render: (value: Brand) => value?.name || 'N/A',
    },
    {
      key: 'release_year',
      label: 'Release Year',
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
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search models by name..." />
          </div>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full sm:w-44 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-500 focus:ring-green-500 bg-white"
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { setEditingModel(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto sm:self-end inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors"
        >
          <span>+</span> Add Model
        </button>
      </div>

      {/* Models table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <HeroUITable
          columns={columns}
          data={models}
          isLoading={isLoading}
          isEmpty={models.length === 0}
          emptyMessage="No models found"
          actions={true}
          onEdit={(model) => { setEditingModel(model); setIsModalOpen(true); }}
          onDelete={(model) => showDeleteConfirmation(model.id, model.name)}
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
        onClose={() => { setIsModalOpen(false); setEditingModel(null); }}
        title={editingModel ? 'Edit Model' : 'Add Model'}
        size="md"
      >
        <ModelForm
          model={editingModel}
          brands={brands}
          onSave={handleSaveModel}
          onCancel={() => { setIsModalOpen(false); setEditingModel(null); }}
        />
      </Modal>
    </div>
  );
}