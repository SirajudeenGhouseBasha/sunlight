/**
 * Admin Predesigned Products Page
 * 
 * Manage predesigned cases (variant + design combinations)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import Link from 'next/link';
import Image from 'next/image';

interface PredesignedProduct {
  id: string;
  name: string;
  description: string;
  price_override: number | null;
  is_featured: boolean;
  is_active: boolean;
  final_price: number;
  variant: {
    color_name: string;
    model: {
      name: string;
      brand: {
        name: string;
      };
    };
  };
  design: {
    name: string;
    image_url: string;
    thumbnail_url: string;
    category: string;
  };
}

export default function AdminPredesignedPage() {
  const [products, setProducts] = useState<PredesignedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'featured' | 'active'>('all');

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filter === 'featured') params.append('featured', 'true');
      if (filter === 'active') params.append('active', 'true');
      
      const res = await fetch(`/api/predesigned?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setProducts(data.predesigned_products || []);
      }
    } catch (error) {
      console.error('Error fetching predesigned products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (id: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/predesigned/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !currentValue }),
      });
      
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const toggleActive = async (id: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/predesigned/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentValue }),
      });
      
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this predesigned product?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/predesigned/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.variant.model.brand.name.toLowerCase().includes(search.toLowerCase()) ||
    product.variant.model.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Predesigned Products</h1>
              <p className="text-sm text-gray-600 mt-1">Manage ready-to-buy cases with designs</p>
            </div>
            <div className="flex space-x-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">Back to Admin</Button>
              </Link>
              <Link href="/admin/predesigned/create">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  ➕ Create Predesigned
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 max-w-7xl mx-auto">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <Input
                  placeholder="Search by name, brand, or model..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11"
                />
              </div>
              
              {/* Filter Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filter === 'featured' ? 'default' : 'outline'}
                  onClick={() => setFilter('featured')}
                  size="sm"
                >
                  ⭐ Featured
                </Button>
                <Button
                  variant={filter === 'active' ? 'default' : 'outline'}
                  onClick={() => setFilter('active')}
                  size="sm"
                >
                  ✓ Active
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading predesigned products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-lg font-semibold mb-2">No Predesigned Products</h3>
              <p className="text-gray-600 mb-6">
                Create your first predesigned case by combining a variant with a design template
              </p>
              <Link href="/admin/predesigned/create">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  ➕ Create First Predesigned Product
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                {/* Product Image */}
                <div className="relative h-64 bg-gray-100">
                  <Image
                    src={product.design.thumbnail_url || product.design.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  {product.is_featured && (
                    <div className="absolute top-2 right-2 bg-orange-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      ⭐ Featured
                    </div>
                  )}
                  {!product.is_active && (
                    <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded text-xs font-semibold">
                      Inactive
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-semibold">Model:</span>{' '}
                      {product.variant.model.brand.name} {product.variant.model.name}
                    </div>
                    <div>
                      <span className="font-semibold">Color:</span> {product.variant.color_name}
                    </div>
                    <div>
                      <span className="font-semibold">Design:</span> {product.design.name}
                    </div>
                    <div>
                      <span className="font-semibold">Category:</span> {product.design.category || 'N/A'}
                    </div>
                    <div className="text-lg font-bold text-orange-600">
                      ₹{product.final_price.toFixed(2)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={product.is_featured ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleFeatured(product.id, product.is_featured)}
                        className="text-xs"
                      >
                        {product.is_featured ? '⭐ Featured' : 'Feature'}
                      </Button>
                      <Button
                        variant={product.is_active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleActive(product.id, product.is_active)}
                        className="text-xs"
                      >
                        {product.is_active ? '✓ Active' : 'Activate'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/admin/predesigned/${product.id}/edit`}>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          ✏️ Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteProduct(product.id)}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
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
