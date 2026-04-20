/**
 * Admin Models Management Page
 * 
 * Create and manage phone models
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Model {
  id: string;
  name: string;
  model_number: string | null;
  screen_size: number | null;
  release_year: number | null;
  brand_id: string;
  created_at: string;
  brand: Brand;
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  
  // Form state
  const [brandId, setBrandId] = useState('');
  const [name, setName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [screenSize, setScreenSize] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter state
  const [filterBrand, setFilterBrand] = useState('');

  useEffect(() => {
    fetchModels();
    fetchBrands();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/models');
      const data = await res.json();
      
      if (res.ok) {
        setModels(data.models || []);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      
      if (res.ok) {
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const resetForm = () => {
    setBrandId('');
    setName('');
    setModelNumber('');
    setScreenSize('');
    setReleaseYear('');
    setError('');
    setEditingModel(null);
    setShowForm(false);
  };

  const handleEdit = (model: Model) => {
    setEditingModel(model);
    setBrandId(model.brand_id);
    setName(model.name);
    setModelNumber(model.model_number || '');
    setScreenSize(model.screen_size?.toString() || '');
    setReleaseYear(model.release_year?.toString() || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!brandId || !name.trim()) {
      setError('Brand and model name are required');
      return;
    }
    
    setFormLoading(true);
    setError('');
    
    try {
      const url = editingModel ? `/api/models/${editingModel.id}` : '/api/models';
      const method = editingModel ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          name: name.trim(),
          model_number: modelNumber.trim() || null,
          screen_size: screenSize ? parseFloat(screenSize) : null,
          release_year: releaseYear ? parseInt(releaseYear) : null,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save model');
      }
      
      await fetchModels();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all associated variants.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/models/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await fetchModels();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete model');
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('Failed to delete model');
    }
  };

  const filteredModels = filterBrand 
    ? models.filter(model => model.brand?.id === filterBrand)
    : models;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Model Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage phone models</p>
            </div>
            <div className="flex space-x-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">Back to Admin</Button>
              </Link>
              <Button 
                onClick={() => setShowForm(true)}
                size="sm" 
                className="bg-orange-600 hover:bg-orange-700"
              >
                ➕ Add Model
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 max-w-6xl mx-auto">
        {/* Create/Edit Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingModel ? 'Edit Model' : 'Add New Model'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Brand */}
                  <div>
                    <Label htmlFor="brandId">Brand *</Label>
                    <select
                      id="brandId"
                      value={brandId}
                      onChange={(e) => setBrandId(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-input bg-transparent"
                      required
                    >
                      <option value="">Select Brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Model Name */}
                  <div>
                    <Label htmlFor="name">Model Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., iPhone 15 Pro, Galaxy S24"
                      className="h-11"
                      required
                    />
                  </div>

                  {/* Model Number */}
                  <div>
                    <Label htmlFor="modelNumber">Model Number</Label>
                    <Input
                      id="modelNumber"
                      value={modelNumber}
                      onChange={(e) => setModelNumber(e.target.value)}
                      placeholder="e.g., A2848, SM-S921B"
                      className="h-11"
                    />
                  </div>

                  {/* Screen Size */}
                  <div>
                    <Label htmlFor="screenSize">Screen Size (inches)</Label>
                    <Input
                      id="screenSize"
                      type="number"
                      step="0.1"
                      value={screenSize}
                      onChange={(e) => setScreenSize(e.target.value)}
                      placeholder="e.g., 6.1, 6.7"
                      className="h-11"
                    />
                  </div>

                  {/* Release Year */}
                  <div>
                    <Label htmlFor="releaseYear">Release Year</Label>
                    <Input
                      id="releaseYear"
                      type="number"
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(e.target.value)}
                      placeholder="e.g., 2024, 2023"
                      className="h-11"
                      min="2000"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={formLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {formLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {editingModel ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingModel ? 'Update Model' : 'Create Model'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="filterBrand">Filter by Brand</Label>
                <select
                  id="filterBrand"
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-input bg-transparent"
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFilterBrand('')}
                  size="sm"
                >
                  Clear Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Models List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading models...</p>
          </div>
        ) : filteredModels.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-2">
                {filterBrand ? 'No Models for This Brand' : 'No Models Yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {filterBrand 
                  ? 'Create the first model for this brand'
                  : 'Create your first phone model to get started'
                }
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                ➕ Add {filterBrand ? 'First' : ''} Model
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <Card key={model.id} className="overflow-hidden">
                <CardContent className="p-6">
                  {/* Brand & Model */}
                  <div className="flex items-center gap-3 mb-4">
                    {model.brand?.logo_url ? (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={model.brand.logo_url}
                          alt={`${model.brand.name} logo`}
                          fill
                          className="object-contain"
                          onError={(e) => {
                            // Hide image on error and show fallback
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600">
                          {model.brand?.name?.charAt(0) || 'M'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{model.name}</h3>
                      <p className="text-sm text-gray-600">{model.brand?.name || 'Unknown Brand'}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {model.model_number && (
                      <div>
                        <span className="font-semibold">Model:</span> {model.model_number}
                      </div>
                    )}
                    {model.screen_size && (
                      <div>
                        <span className="font-semibold">Screen:</span> {model.screen_size}"
                      </div>
                    )}
                    {model.release_year && (
                      <div>
                        <span className="font-semibold">Year:</span> {model.release_year}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Created: {new Date(model.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(model)}
                      className="flex-1"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(model.id, model.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Brands Warning */}
        {brands.length === 0 && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-2">
                  ⚠️ No Brands Available
                </h3>
                <p className="text-orange-800 text-sm mb-3">
                  You need to create brands before you can add models.
                </p>
                <Link href="/admin/brands">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                    🏢 Manage Brands
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}