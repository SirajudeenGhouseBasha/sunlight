/**
 * Product Types Management Page
 * 
 * Admin interface for managing product types (Silicone, Glass, Clear, Leather)
 * Requirements: 2.1, 2.2, 2.3, 11.5 - Product type management
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import Link from 'next/link';
import { ProductType, PRODUCT_TYPES } from '@/src/types/products';

export default function ProductTypesPage() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProductTypes();
  }, []);

  const fetchProductTypes = async () => {
    try {
      const response = await fetch('/api/product-types');
      const data = await response.json();
      setProductTypes(data.product_types || []);
    } catch (err) {
      setError('Failed to load product types');
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
        ? `/api/product-types/${editingId}` 
        : '/api/product-types';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          base_price: parseFloat(formData.base_price),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save product type');
      }

      setSuccess(editingId ? 'Product type updated!' : 'Product type created!');
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', base_price: '' });
      fetchProductTypes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (productType: ProductType) => {
    setEditingId(productType.id);
    setFormData({
      name: productType.name,
      description: productType.description || '',
      base_price: productType.base_price.toString(),
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product type?')) return;

    try {
      const response = await fetch(`/api/product-types/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete product type');
      }

      setSuccess('Product type deleted!');
      fetchProductTypes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Seed default product types (Silicone, Glass, Clear, Leather)?')) return;

    try {
      const response = await fetch('/api/product-types', {
        method: 'PUT',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to seed product types');
      }

      setSuccess('Default product types seeded successfully!');
      fetchProductTypes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', base_price: '' });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Product Types</h1>
              <p className="text-sm text-gray-600 mt-1">Manage case materials</p>
            </div>
            <Link href="/admin">
              <Button variant="outline" size="sm">← Back</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 max-w-4xl mx-auto">
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => setShowForm(!showForm)} 
              className="h-11 flex-1"
            >
              {showForm ? '✕ Cancel' : '+ Add Product Type'}
            </Button>
            <Button 
              onClick={handleSeedDefaults} 
              variant="outline"
              className="h-11 flex-1"
            >
              🌱 Seed Defaults
            </Button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? 'Edit' : 'Add'} Product Type</CardTitle>
                <CardDescription>
                  {editingId ? 'Update' : 'Create a new'} case material type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Silicone"
                      required
                      className="h-11 mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the material"
                      className="h-11 mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="base_price">Base Price ($) *</Label>
                    <Input
                      id="base_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      placeholder="15.99"
                      required
                      className="h-11 mt-1"
                    />
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

          {/* Product Types List */}
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Loading product types...
              </CardContent>
            </Card>
          ) : productTypes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 mb-4">No product types yet</p>
                <Button onClick={handleSeedDefaults} variant="outline">
                  🌱 Seed Default Types
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {productTypes.map((type) => (
                <Card key={type.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {type.name}
                        </h3>
                        {type.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {type.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-lg font-bold text-green-600">
                            ${type.base_price.toFixed(2)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            type.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {type.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleEdit(type)}
                          variant="outline"
                          size="sm"
                          className="h-9 w-20"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(type.id)}
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
