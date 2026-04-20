/**
 * Featured Products Component
 * 
 * Display featured and trending products
 * Requirements: 12.4, 5.4 - Product discovery and recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';

interface FeaturedProduct {
  id: string;
  variant_id: string;
  name: string;
  brand: string;
  model: string;
  product_type: string;
  color_name: string;
  color_hex?: string;
  price: number;
  in_stock: boolean;
}

interface FeaturedProductsProps {
  title?: string;
  limit?: number;
  onAddToCart?: (variantId: string) => void;
}

export function FeaturedProducts({
  title = '✨ Featured Products',
  limit = 4,
  onAddToCart,
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [limit]);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/featured?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(limit)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <Link href={`/products/${product.variant_id}`}>
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative">
                {product.color_hex && (
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{ backgroundColor: product.color_hex }}
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl sm:text-6xl">📱</div>
                </div>
                {!product.in_stock && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    Out of Stock
                  </div>
                )}
              </div>
            </Link>
            
            <CardContent className="p-3 sm:p-4">
              <Link href={`/products/${product.variant_id}`}>
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate hover:text-blue-600">
                  {product.brand} {product.model}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                  {product.color_name}
                </p>
              </Link>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-base sm:text-lg font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
                {onAddToCart && (
                  <Button
                    onClick={() => onAddToCart(product.variant_id)}
                    disabled={!product.in_stock}
                    size="sm"
                    className="text-xs h-8"
                  >
                    {product.in_stock ? 'Add' : 'Out'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
