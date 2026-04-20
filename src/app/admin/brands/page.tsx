/**
 * Admin Brands Management Page
 * 
 * Create and manage smartphone brands
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import Link from 'next/link';
import Image from 'next/image';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  created_at: string;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/brands');
      const data = await res.json();
      
      if (res.ok) {
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setLogoUrl('');
    setDescription('');
    setError('');
    setEditingBrand(null);
    setShowForm(false);
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setLogoUrl(brand.logo_url || '');
    setDescription(brand.description || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Brand name is required');
      return;
    }
    
    setFormLoading(true);
    setError('');
    
    try {
      const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands';
      const method = editingBrand ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          logo_url: logoUrl.trim() || null,
          description: description.trim() || null,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save brand');
      }
      
      await fetchBrands();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all associated models and variants.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/brands/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await fetchBrands();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete brand');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert('Failed to delete brand');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage smartphone brands</p>
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
                ➕ Add Brand
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
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
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
                  {/* Brand Name */}
                  <div>
                    <Label htmlFor="name">Brand Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Apple, Samsung, Google"
                      className="h-11"
                      required
                    />
                  </div>

                  {/* Logo URL */}
                  <div>
                    <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                    <Input
                      id="logoUrl"
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the brand..."
                    rows={3}
                  />
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
                        {editingBrand ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingBrand ? 'Update Brand' : 'Create Brand'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Brands List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading brands...</p>
          </div>
        ) : brands.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-semibold mb-2">No Brands Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first smartphone brand to get started
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                ➕ Add First Brand
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand) => (
              <Card key={brand.id} className="overflow-hidden">
                <CardContent className="p-6">
                  {/* Logo */}
                  <div className="flex items-center gap-4 mb-4">
                    {brand.logo_url ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={brand.logo_url}
                          alt={`${brand.name} logo`}
                          fill
                          className="object-contain"
                          onError={(e) => {
                            // Hide image on error and show fallback
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-600">
                          {brand.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{brand.name}</h3>
                      <p className="text-sm text-gray-600">/{brand.slug}</p>
                    </div>
                  </div>

                  {/* Description */}
                  {brand.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {brand.description}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="text-xs text-gray-500 mb-4">
                    Created: {new Date(brand.created_at).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(brand)}
                      className="flex-1"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(brand.id, brand.name)}
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
      </main>
    </div>
  );
}