/**
 * Product Variants Management Page
 * 
 * Admin interface for managing product variants (colors, pricing, inventory)
 * Requirements: 2.4, 2.5, 11.5 - Variant management and pricing
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import Link from 'next/link';
import { ProductVariant, ProductType, PhoneModel, COLORS } from '@/src/types/products';

export default function VariantsPage() {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [models, setModels] = useState<PhoneModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    model_id: '',
    product_type_id: '',
    color_name: '',
    color_hex: '#000000',
    price_modifier: '0',
    stock_quantity: '0',
  });
  const [filters, setFilters] = useState({
    model_id: '',
    product_type_id: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch variants with filters
      const variantsParams = new URLSearchParams();
      if (filters.model_id) variantsParams.set('model_id', filters.model_id);
      if (filters.product_type_id) variantsParams.set('product_type_id', filters.product_type_id);
      
      const [variantsRes, typesRes, modelsRes] = await Promise.all([
        fetch(`/api/variants?${variantsParams}`),
        fetch('/api/product-types'),
        fetch('/api/models'),
      ]);

      const [variantsData, typesData, modelsData] = await Promise.all([
        variantsRes.json(),
        typesRes.json(),
        modelsRes.json(),
      ]);

      setVariants(variantsData.variants || []);
      setProductTypes(typesData.product_types || []);
      setModels(modelsData.models || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingId 
        ? `/api/variants/${editingId}` 
        : '/api/variants';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: formData.model_id,
          product_type_id: formData.product_type_id,
          color_name: formData.color_name,
          color_hex: formData.color_hex,
          price_modifier: parseFloat(formData.price_modifier),
          stock_quantity: parseInt(formData.stock_quantity),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save variant');
      }

      setSuccess(editingId ? 'Variant updated!' : 'Variant created!');
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingId(variant.id);
    setFormData({
      model_id: variant.model_id,
      product_type_id: variant.product_type_id,
      color_name: variant.color_name,
      color_hex: variant.color_hex || '#000000',
      price_modifier: variant.price_modifier.toString(),
      stock_quantity: variant.stock_quantity.toString(),
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      const response = await fetch(`/api/variants/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete variant');
      }

      setSuccess('Variant deleted!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      model_id: '',
      product_type_id: '',
      color_name: '',
      color_hex: '#000000',
      price_modifier: '0',
      stock_quantity: '0',
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
    setError('');
  };

  const selectPredefinedColor = (colorName: string, colorHex: string) => {
    setFormData({
      ...formData,
      color_name: colorName,
      color_hex: colorHex,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Product Variants</h1>
              <p className="text-sm text-gray-600 mt-1">Manage colors & inventory</p>
            </div>
            <Link href="/admin">
              <Button variant="outline" size="sm">← Back</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 max-w-6xl mx-auto">
        <div className="space-y-4">
          
          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="filter-model" className="text-sm">Model</Label>
                  <select
                    id="filter-model"
                    value={filters.model_id}
                    onChange={(e) => setFilters({ ...filters, model_id: e.target.value })}
                    className="w-full h-11 mt-1 px-3 border border-gray-300 rounded-md bg-white"
                  >
                    <option value="">All Models</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.brand?.name} {model.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="filter-type" className="text-sm">Product Type</Label>
                  <select
                    id="filter-type"
                    value={filters.product_type_id}
                    onChange={(e) => setFilters({ ...filters, product_type_id: e.target.value })}
                    className="w-full h-11 mt-1 px-3 border border-gray-300 rounded-md bg-white"
                  >
                    <option value="">All Types</option>
                    {productTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className="h-11 w-full"
          >
            {showForm ? '✕ Cancel' : '+ Add Variant'}
          </Button>

          {/* Add/Edit Form */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? 'Edit' : 'Add'} Variant</CardTitle>
                <CardDescription>
                  {editingId ? 'Update' : 'Create a new'} product variant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="model_id">Phone Model *</Label>
                      <select
                        id="model_id"
                        value={formData.model_id}
                        onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                        required
                        className="w-full h-11 mt-1 px-3 border border-gray-300 rounded-md bg-white"
                      >
                        <option value="">Select Model</option>
                        {models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.brand?.name} {model.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="product_type_id">Product Type *</Label>
                      <select
                        id="product_type_id"
                        value={formData.product_type_id}
                        onChange={(e) => setFormData({ ...formData, product_type_id: e.target.value })}
                        required
                        className="w-full h-11 mt-1 px-3 border border-gray-300 rounded-md bg-white"
                      >
                        <option value="">Select Type</option>
                        {productTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name} (${type.base_price})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Color Picker Section */}
                  <div>
                    <Label>Color *</Label>
                    <div className="mt-2 space-y-3">
                      {/* Predefined Colors */}
                      <div>
                        <p className="text-xs text-gray-600 mb-2">Popular Colors:</p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {Object.values(COLORS).filter(c => c.is_popular).map((color) => (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => selectPredefinedColor(color.name, color.hex)}
                              className={`h-12 rounded-lg border-2 transition-all ${
                                formData.color_name === color.name
                                  ? 'border-blue-500 ring-2 ring-blue-200'
                                  : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            >
                              <span className="sr-only">{color.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Color */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="color_name" className="text-sm">Color Name</Label>
                          <Input
                            id="color_name"
                            value={formData.color_name}
                            onChange={(e) => setFormData({ ...formData, color_name: e.target.value })}
                            placeholder="e.g., Midnight Blue"
                            required
                            className="h-11 mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="color_hex" className="text-sm">Hex Code</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="color_hex"
                              type="color"
                              value={formData.color_hex}
                              onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                              className="h-11 w-20"
                            />
                            <Input
                              value={formData.color_hex}
                              onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                              placeholder="#000000"
                              className="h-11 flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price_modifier">Price Modifier ($)</Label>
                      <Input
                        id="price_modifier"
                        type="number"
                        step="0.01"
                        value={formData.price_modifier}
                        onChange={(e) => setFormData({ ...formData, price_modifier: e.target.value })}
                        placeholder="0.00"
                        className="h-11 mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Add to or subtract from base price
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        min="0"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        placeholder="100"
                        required
                        className="h-11 mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="h-11 flex-1">
                      {editingId ? 'Update' : 'Create'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={cancelForm}
                      className="h-11 flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Variants List */}
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Loading variants...
              </CardContent>
            </Card>
          ) : variants.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 mb-4">No variants found</p>
                <p className="text-sm text-gray-400">
                  Create variants to manage product colors and inventory
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {variants.map((variant) => (
                <Card key={variant.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Color Preview */}
                      <div 
                        className="w-16 h-16 rounded-lg border-2 border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: variant.color_hex || '#000000' }}
                      />
                      
                      {/* Variant Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {variant.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {variant.model?.brand?.name} {variant.model?.name} • {variant.product_type?.name}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-700">
                            {variant.color_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            Stock: {variant.stock_quantity}
                          </span>
                          {variant.price_modifier !== 0 && (
                            <span className={`text-sm font-medium ${
                              variant.price_modifier > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {variant.price_modifier > 0 ? '+' : ''}${variant.price_modifier.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleEdit(variant)}
                          variant="outline"
                          size="sm"
                          className="h-9 w-20"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(variant.id)}
                          variant="outline"
                          size="sm"
                          className="h-9 w-20 text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
