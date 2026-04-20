/**
 * Homepage - BeMinimalist-inspired design
 * 
 * Clean, minimal, and conversion-focused landing page
 * Requirements: 12.1, 12.2 - Product discovery and user experience
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainNav } from '@/src/components/navigation/MainNav';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { useCart } from '@/src/context/CartContext';
import { ArrowRight, Shield, Zap, DollarSign, Star } from 'lucide-react';

interface Product {
  id: string;
  variant_id: string;
  name: string;
  brand: { name: string; slug: string };
  model: { name: string };
  product_type: { name: string };
  color_name: string;
  color_hex?: string;
  price: number;
  stock_quantity: number;
  in_stock: boolean;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

interface ProductType {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function HomePage() {
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, brandsRes, typesRes] = await Promise.all([
        fetch('/api/products/featured?limit=4'),
        fetch('/api/brands'),
        fetch('/api/product-types'),
      ]);

      const [productsData, brandsData, typesData] = await Promise.all([
        productsRes.json(),
        brandsRes.json(),
        typesRes.json(),
      ]);

      setFeaturedProducts(productsData.products || []);
      setBrands((brandsData.brands || []).slice(0, 6));
      setProductTypes((typesData.product_types || []).slice(0, 6));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (variantId: string) => {
    try {
      await addToCart(variantId);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <MainNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-4">
            Premium Phone Cases
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Protect your device with style. Custom designs, premium materials, affordable prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="h-12 px-8 text-base">
                Shop Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/dashboard/designs">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Create Custom Design
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 px-4 sm:px-6 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-black mb-2">Premium Quality</h3>
              <p className="text-sm text-gray-600">
                High-quality materials for maximum protection
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-black mb-2">Custom Designs</h3>
              <p className="text-sm text-gray-600">
                Upload your own design or choose from templates
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-black mb-2">Affordable</h3>
              <p className="text-sm text-gray-600">
                Premium cases accessible to everyone
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-black mb-2">Perfect Fit</h3>
              <p className="text-sm text-gray-600">
                Designed specifically for your phone model
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-black">Our Best Sellers</h2>
            <Link href="/products" className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📱</div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                  <Link href={`/products/${product.variant_id}`}>
                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                      {product.color_hex && (
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{ backgroundColor: product.color_hex }}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl">📱</div>
                      </div>
                      {!product.in_stock && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded">
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <CardContent className="p-4">
                    <Link href={`/products/${product.variant_id}`}>
                      <h3 className="font-semibold text-black group-hover:text-orange-600 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {product.product_type.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {product.color_hex && (
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: product.color_hex }}
                          />
                        )}
                        <span className="text-xs text-gray-500">{product.color_name}</span>
                      </div>
                    </Link>
                    
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xl font-bold text-black">
                        ${product.price.toFixed(2)}
                      </span>
                      <Button
                        onClick={() => handleAddToCart(product.variant_id)}
                        disabled={!product.in_stock}
                        size="sm"
                        className="h-9"
                      >
                        {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Shop by Brand */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">Shop by Brand</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brand=${brand.slug}`}
                className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow flex items-center justify-center"
              >
                <span className="text-lg font-semibold text-black">{brand.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Type */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">Shop by Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productTypes.map((type) => (
              <Link
                key={type.id}
                href={`/products?type=${type.slug}`}
                className="group"
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-5xl">📱</div>
                    </div>
                    <h3 className="font-semibold text-black group-hover:text-orange-600 transition-colors">
                      {type.name}
                    </h3>
                    {type.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {type.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Create Your Custom Phone Case
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Upload your own design or choose from our templates. Make your phone truly yours.
          </p>
          <Link href="/dashboard/designs">
            <Button size="lg" variant="secondary" className="h-12 px-8 text-base bg-orange-600 hover:bg-orange-700 text-white">
              Start Designing
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
