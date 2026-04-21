/**
 * Variants Table Component
 * 
 * Mobile-first table for displaying and managing product variants
 * Requirements: 2.4, 2.5, 11.5 - Variant management and pricing
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card, CardContent } from '@/src/components/ui/card';
import { Select, SelectOption } from '@/src/components/ui/select';
import { ProductVariant } from '@/src/types/products';

export function VariantsTable() {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ProductVariant>>({});

  // Filters
  const [filters, setFilters] = useState({
    model_id: '',
    product_type_id: '',
    active: '',
    in_stock: '',
  });

  const fetchVariants = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/variants?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch variants');
      }

      setVariants(data.variants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingId(variant.id);
    setEditData({
      color_name: variant.color_name,
      color_hex: variant.color_hex,
      price_modifier: variant.price_modifier,
      stock_quantity: variant.stock_quantity,
      is_active: variant.is_active,
    });
  };

  const handleSave = async (id: string) => {
    try {
      const response = await fetch(`/api/variants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update variant');
      }

      setEditingId(null);
      setEditData({});
      fetchVariants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete variant "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/variants/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete variant');
      }

      fetchVariants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const calculateTotalPrice = (variant: ProductVariant) => {
    const basePrice = variant.product_type?.base_price || 0;
    const modifier = editingId === variant.id ? (editData.price_modifier || 0) : variant.price_modifier;
    return basePrice + modifier;
  };

  useEffect(() => {
    fetchVariants();
  }, [filters]);

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
          onClick={fetchVariants}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <Select
          value={filters.active}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters((prev) => ({ ...prev, active: e.target.value }))}
        >
          <SelectOption value="">All Status</SelectOption>
          <SelectOption value="true">Active Only</SelectOption>
          <SelectOption value="false">Inactive Only</SelectOption>
        </Select>
        
        <Select
          value={filters.in_stock}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters((prev) => ({ ...prev, in_stock: e.target.value }))}
        >
          <SelectOption value="">All Stock</SelectOption>
          <SelectOption value="true">In Stock Only</SelectOption>
        </Select>
        
        <Button
          onClick={() => setFilters({ model_id: '', product_type_id: '', active: '', in_stock: '' })}
          variant="outline"
          size="sm"
        >
          Clear Filters
        </Button>
        
        <Button
          onClick={fetchVariants}
          variant="outline"
          size="sm"
        >
          Refresh
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🎨</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Variants Found</h3>
          <p className="text-gray-600 mb-4">Create your first product variant to get started.</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards Layout */}
          <div className="space-y-4 sm:hidden">
            {variants.map((variant) => (
              <Card key={variant.id} className={!variant.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-200"
                        style={{ backgroundColor: variant.color_hex || '#000000' }}
                      ></div>
                      <div>
                        <h3 className="font-medium">{variant.color_name}</h3>
                        <p className="text-sm text-gray-600">
                          {variant.model?.brand?.name} {variant.model?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {variant.product_type?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ${calculateTotalPrice(variant).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Stock: {editingId === variant.id ? editData.stock_quantity : variant.stock_quantity}
                      </div>
                    </div>
                  </div>
                  
                  {editingId === variant.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Color name"
                          value={editData.color_name || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData((prev) => ({ ...prev, color_name: e.target.value }))}
                          className="text-sm"
                        />
                        <Input
                          type="color"
                          value={editData.color_hex || '#000000'}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData((prev) => ({ ...prev, color_hex: e.target.value }))}
                          className="h-8 w-full"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Price modifier"
                          value={editData.price_modifier || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData((prev) => ({ ...prev, price_modifier: parseFloat(e.target.value) || 0 }))}
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          min="0"
                          placeholder="Stock"
                          value={editData.stock_quantity || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData((prev) => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => handleSave(variant.id)} size="sm" className="flex-1">
                          Save
                        </Button>
                        <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <Button onClick={() => handleEdit(variant)} variant="outline" size="sm" className="flex-1">
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(variant.id, variant.color_name)}
                        variant="destructive"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Color</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Device</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr 
                    key={variant.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      !variant.is_active ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200"
                          style={{ backgroundColor: variant.color_hex || '#000000' }}
                        ></div>
                        {editingId === variant.id ? (
                          <Input
                            value={editData.color_name || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData((prev) => ({ ...prev, color_name: e.target.value }))}
                            className="w-32 h-8 text-sm"
                          />
                        ) : (
                          <span className="font-medium">{variant.color_name}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{variant.model?.name}</div>
                        <div className="text-sm text-gray-500">{variant.model?.brand?.name}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{variant.product_type?.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-bold text-green-600">
                          ${calculateTotalPrice(variant).toFixed(2)}
                        </div>
                        {editingId === variant.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editData.price_modifier || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData((prev) => ({ ...prev, price_modifier: parseFloat(e.target.value) || 0 }))}
                            className="w-20 h-6 text-xs mt-1"
                            placeholder="Modifier"
                          />
                        ) : (
                          <div className="text-xs text-gray-500">
                            +${variant.price_modifier.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {editingId === variant.id ? (
                        <Input
                          type="number"
                          min="0"
                          value={editData.stock_quantity || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditData((prev) => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                          className="w-20 h-8 text-sm"
                        />
                      ) : (
                        <div className={`font-medium ${
                          variant.stock_quantity === 0 ? 'text-red-600' : 
                          variant.stock_quantity < 10 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {variant.stock_quantity}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                        variant.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {variant.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {editingId === variant.id ? (
                        <div className="flex space-x-1">
                          <Button onClick={() => handleSave(variant.id)} size="sm">
                            Save
                          </Button>
                          <Button onClick={handleCancel} variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex space-x-1">
                          <Button onClick={() => handleEdit(variant)} variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(variant.id, variant.color_name)}
                            variant="destructive"
                            size="sm"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}