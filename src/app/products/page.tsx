/**
 * Product Catalog Page
 * 
 * Browse and search products
 * Requirements: 12.1, 12.2, 12.3 - Product discovery
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import Link from 'next/link';
import { useCart } from '@/src/context/CartContext';
import { SearchAutocomplete } from '@/src/components/search/SearchAutocomplete';
import { FeaturedProducts } from '@/src/components/products/FeaturedProducts';
import { MainNav } from '@/src/components/navigation/MainNav';

interface Product {
  id: string;
  variant_id: string;
  name: string;
  brand: { id: string; name: string; slug: string };
  model: { id: string; name: string; slug: string };
  product_type: { id: string; name: string; slug: string; description?: string };
  color_name: string;
  color_hex?: string;
  price: number;
  stock_quantity: number;
  in_stock: boolean;
}

interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
}

interface ProductType {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedBrand, selectedModel, selectedType, inStockOnly]);

  // Filter models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      const filtered = models.filter(model => model.brand_id === selectedBrand);
      setFilteredModels(filtered);
      // Reset model selection if current model doesn't belong to selected brand
      if (selectedModel && !filtered.find(m => m.id === selectedModel)) {
        setSelectedModel('');
      }
    } else {
      setFilteredModels(models);
      setSelectedModel('');
    }
  }, [selectedBrand, models, selectedModel]);

  const fetchFilters = async () => {
    try {
      const [brandsRes, modelsRes, typesRes] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/models'),
        fetch('/api/product-types'),
      ]);

      const [brandsData, modelsData, typesData] = await Promise.all([
        brandsRes.json(),
        modelsRes.json(),
        typesRes.json(),
      ]);

      setBrands(brandsData.brands || []);
      setModels(modelsData.models || []);
      setFilteredModels(modelsData.models || []);
      setProductTypes(typesData.product_types || []);
    } catch (err) {
      console.error('Failed to load filters');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedBrand) params.set('brand_id', selectedBrand);
      if (selectedModel) params.set('model_id', selectedModel);
      if (selectedType) params.set('product_type_id', selectedType);
      if (inStockOnly) params.set('in_stock', 'true');

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (variantId: string) => {
    try {
      setError('');
      setSuccess('');
      await addToCart(variantId);
      setSuccess('Added to cart!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <MainNav />

      {/* Main Content */}
      <main className="px-4 py-8 sm:px-6 max-w-7xl mx-auto">
        <div className="space-y-8">
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

          {/* Featured Products (shown when no search/filters) */}
          {!search && !selectedBrand && !selectedModel && !selectedType && !inStockOnly && (
            <FeaturedProducts
              title="✨ Featured Products"
              limit={8}
              onAddToCart={handleAddToCart}
            />
          )}

          {/* Search & Filters */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6 space-y-4">
              {/* Search with Autocomplete */}
              <SearchAutocomplete
                value={search}
                onChange={setSearch}
                placeholder="Search by brand, model, or type..."
              />

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Brand Filter */}
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="h-12 px-4 border border-gray-300 rounded-lg bg-white text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>

                {/* Model Filter - Dependent on Brand */}
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={!selectedBrand}
                  className="h-12 px-4 border border-gray-300 rounded-lg bg-white text-sm disabled:bg-gray-50 disabled:cursor-not-allowed focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                >
                  <option value="">
                    {selectedBrand ? 'All Models' : 'Select Brand First'}
                  </option>
                  {filteredModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>

                {/* Product Type Filter */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="h-12 px-4 border border-gray-300 rounded-lg bg-white text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                >
                  <option value="">All Types</option>
                  {productTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>

                {/* In Stock Filter */}
                <label className="flex items-center gap-3 h-12 px-4 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-orange-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">In Stock Only</span>
                </label>
              </div>

              {/* Active Filters Display */}
              {(selectedBrand || selectedModel || selectedType || inStockOnly) && (
                <div className="flex flex-wrap gap-2 items-center pt-2">
                  <span className="text-sm font-medium text-gray-700">Active filters:</span>
                  {selectedBrand && (
                    <button
                      onClick={() => setSelectedBrand('')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-100 transition-colors"
                    >
                      {brands.find(b => b.id === selectedBrand)?.name}
                      <span className="text-orange-500 font-bold">×</span>
                    </button>
                  )}
                  {selectedModel && (
                    <button
                      onClick={() => setSelectedModel('')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-100 transition-colors"
                    >
                      {filteredModels.find(m => m.id === selectedModel)?.name}
                      <span className="text-orange-500 font-bold">×</span>
                    </button>
                  )}
                  {selectedType && (
                    <button
                      onClick={() => setSelectedType('')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-100 transition-colors"
                    >
                      {productTypes.find(t => t.id === selectedType)?.name}
                      <span className="text-orange-500 font-bold">×</span>
                    </button>
                  )}
                  {inStockOnly && (
                    <button
                      onClick={() => setInStockOnly(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-100 transition-colors"
                    >
                      In Stock Only
                      <span className="text-orange-500 font-bold">×</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedBrand('');
                      setSelectedModel('');
                      setSelectedType('');
                      setInStockOnly(false);
                    }}
                    className="text-sm text-gray-600 hover:text-black font-medium underline ml-2"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📱</div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <Card className="border-gray-200">
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-black mb-2">
                  No products found
                </h2>
                <p className="text-gray-600">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-sm font-medium text-gray-700">
                {products.length} product{products.length !== 1 ? 's' : ''} found
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200">
                    <Link href={`/products/${product.variant_id}`}>
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative">
                        {product.color_hex && (
                          <div
                            className="absolute inset-0 opacity-20"
                            style={{ backgroundColor: product.color_hex }}
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-7xl">📱</div>
                        </div>
                        {!product.in_stock && (
                          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                            Out of Stock
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    <CardContent className="p-5">
                      <Link href={`/products/${product.variant_id}`}>
                        <h3 className="font-semibold text-black group-hover:text-orange-600 transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {product.product_type.name}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          {product.color_hex && (
                            <div
                              className="w-5 h-5 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: product.color_hex }}
                            />
                          )}
                          <span className="text-sm text-gray-600">{product.color_name}</span>
                        </div>
                      </Link>
                      
                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                        <span className="text-xl font-bold text-black">
                          ${product.price.toFixed(2)}
                        </span>
                        <Button
                          onClick={() => handleAddToCart(product.variant_id)}
                          disabled={!product.in_stock}
                          size="sm"
                          className="h-10 px-4"
                        >
                          {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
