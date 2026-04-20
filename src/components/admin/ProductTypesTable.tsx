/**
 * Product Types Table Component
 * 
 * Mobile-first table for displaying and managing product types
 * Requirements: 2.2, 11.5 - Product type management
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { ProductType } from '@/types/products';

export function ProductTypesTable() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductTypes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/product-types');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product types');
      }

      setProductTypes(data.product_types || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/product-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update product type');
      }

      // Refresh the list
      fetchProductTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/product-types/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete product type');
      }

      // Refresh the list
      fetchProductTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">{error}</p>
        <Button
          onClick={fetchProductTypes}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (productTypes.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Product Types</h3>
        <p className="text-gray-600 mb-4">Get started by creating your first product type or seeding default types.</p>
        <Button onClick={fetchProductTypes} variant="outline">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile-First Cards Layout */}
      <div className="space-y-4 sm:hidden">
        {productTypes.map((productType) => (
          <Card key={productType.id} className={!productType.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-lg">{productType.name}</h3>
                  <p className="text-sm text-gray-600">{productType.slug}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    ${productType.base_price.toFixed(2)}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    productType.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {productType.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
              
              {productType.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {productType.description}
                </p>
              )}
              
              {productType.material_properties && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">Material Properties:</div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {productType.material_properties.durability} durability
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {productType.material_properties.protection_level} protection
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      {productType.material_properties.flexibility}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleToggleActive(productType.id, productType.is_active)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  {productType.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  onClick={() => handleDelete(productType.id, productType.name)}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Base Price</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Properties</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {productTypes.map((productType) => (
              <tr 
                key={productType.id} 
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  !productType.is_active ? 'opacity-60' : ''
                }`}
              >
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium">{productType.name}</div>
                    <div className="text-sm text-gray-500">{productType.slug}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="max-w-xs">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {productType.description || 'No description'}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-bold text-green-600">
                    ${productType.base_price.toFixed(2)}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {productType.material_properties && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {productType.material_properties.durability}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {productType.material_properties.protection_level}
                      </span>
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                    productType.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {productType.is_active ? 'Active' : 'Inactive'}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleToggleActive(productType.id, productType.is_active)}
                      variant="outline"
                      size="sm"
                    >
                      {productType.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      onClick={() => handleDelete(productType.id, productType.name)}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}