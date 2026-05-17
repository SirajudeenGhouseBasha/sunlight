/**
 * VariantsModule Component
 * 
 * Variants management module with CRUD operations
 * Requirements: 11.1-11.11 - Variants module specifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Modal } from '@/src/components/admin/shared/Modal';
import { DataTable } from '@/src/components/admin/shared/DataTable';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { VariantForm } from '@/src/components/admin/forms/VariantForm';
import { useToast } from '@/src/components/admin/shared/Toast';

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
  additional_image_urls?: string[];
  is_active: boolean;
  created_at: string;
}

// API response types
interface ModelsResponse {
  models: Model[];
}

interface ProductTypesResponse {
  product_types: ProductType[];
}

interface VariantsResponse {
  variants: Variant[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function VariantsModule() {
  const { showToast } = useToast();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch variants
  const fetchVariants = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchQuery,
        model_id: modelFilter,
        product_type_id: productTypeFilter,
        color: colorFilter,
      });
      const response = await fetch(`/api/variants?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch variants');
      }
      const data: VariantsResponse = await response.json();
      setVariants(data.variants);
      setTotalItems(data.pagination?.total ?? 0);
    } catch (error) {
      console.error('Error fetching variants:', error);
      showToast('Failed to load variants', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch models for dropdown
  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data: ModelsResponse = await response.json();
      setModels(data.models);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  // Fetch product types for dropdown
  const fetchProductTypes = async () => {
    try {
      const response = await fetch('/api/product-types');
      if (!response.ok) {
        throw new Error('Failed to fetch product types');
      }
      const data: ProductTypesResponse = await response.json();
      setProductTypes(data.product_types);
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, modelFilter, productTypeFilter, colorFilter]);

  useEffect(() => {
    fetchVariants();
    fetchModels();
    fetchProductTypes();
  }, [currentPage, pageSize, searchQuery, modelFilter, productTypeFilter, colorFilter]);

  // Handle create/edit variant
  const handleSaveVariant = async (variantData: Omit<Variant, 'id' | 'created_at'>) => {
    try {
      const url = editingVariant ? `/api/variants/${editingVariant.id}` : '/api/variants';
      const method = editingVariant ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variantData),
      });

      if (!response.ok) {
        throw new Error('Failed to save variant');
      }

      const savedVariant: Variant = await response.json();
      
      if (editingVariant) {
        setVariants(variants.map(v => v.id === editingVariant.id ? savedVariant : v));
        showToast('Variant updated successfully', 'success');
      } else {
        setVariants([...variants, savedVariant]);
        showToast('Variant created successfully', 'success');
      }
      setIsModalOpen(false);
      setEditingVariant(null);
      fetchVariants();
    } catch (error) {
      console.error('Error saving variant:', error);
      showToast('Failed to save variant', 'error');
    }
  };

  // Handle delete variant
  const handleDeleteVariant = async (variantId: string) => {
    try {
      const response = await fetch(`/api/variants/${variantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete variant');
      }

      setVariants(variants.filter(v => v.id !== variantId));
      showToast('Variant deleted successfully', 'success');
      fetchVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      showToast('Failed to delete variant', 'error');
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = (variantId: string, variantName: string) => {
    if (window.confirm(`Are you sure you want to delete "${variantName}"?`)) {
      handleDeleteVariant(variantId);
    }
  };

  // Columns for DataTable
  const columns = [
    {
      key: 'image_url',
      label: 'Image',
      render: (value: string) => (
        value ? (
          <img
            src={value}
            alt="Variant"
            className="w-10 h-10 rounded object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
            <span className="text-sm text-gray-500">No image</span>
          </div>
        )
      ),
    },
    {
      key: 'name',
      label: 'Variant Name',
    },
    {
      key: 'model',
      label: 'Model',
      render: (value: Model) => value?.name || 'N/A',
    },
    {
      key: 'product_type',
      label: 'Product Type',
      render: (value: ProductType) => value?.name || 'N/A',
    },
    {
      key: 'color_name',
      label: 'Color',
      render: (value: string, variant: Variant) => (
        <div className="flex items-center space-x-2">
          <div
            className="w-6 h-6 rounded border border-gray-200"
            style={{ backgroundColor: variant.color_hex }}
          />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'price_modifier',
      label: 'Price Modifier',
      render: (value: number) => (value ? `+$${value.toFixed(2)}` : '$0.00'),
    },
    {
      key: 'stock_quantity',
      label: 'Stock',
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
  ];

  return (
    <div className="space-y-6">
      {/* Header with search, filters, and add button */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search variants by name..."
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-48">
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">All Models</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <select
              value={productTypeFilter}
              onChange={(e) => setProductTypeFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">All Product Types</option>
              {productTypes.map((productType) => (
                <option key={productType.id} value={productType.id}>
                  {productType.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">All Colors</option>
              {[...new Set(variants.map(v => v.color_name))].map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => { setEditingVariant(null); setIsModalOpen(true); }}>
            Add Variant
          </Button>
        </div>
      </div>

      {/* Variants table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={variants}
          isLoading={isLoading}
          isEmpty={variants.length === 0}
          emptyMessage="No variants found"
          actions={true}
          onEdit={(variant) => { setEditingVariant(variant); setIsModalOpen(true); }}
          onDelete={(variant) => showDeleteConfirmation(variant.id, variant.name)}
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
        onClose={() => { setIsModalOpen(false); setEditingVariant(null); }}
        title={editingVariant ? 'Edit Variant' : 'Add Variant'}
        size="xl"
      >
        <VariantForm
          variant={editingVariant}
          models={models}
          productTypes={productTypes}
          onSave={handleSaveVariant}
          onCancel={() => { setIsModalOpen(false); setEditingVariant(null); }}
        />
      </Modal>
    </div>
  );
}