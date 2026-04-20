/**
 * Product Details Page
 * 
 * View product details and add to cart
 * Requirements: Product detail view
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/src/context/CartContext';
import { RelatedProducts } from '@/src/components/products/RelatedProducts';
import { MainNav } from '@/src/components/navigation/MainNav';

interface Product {
  id: string;
  name: string;
  color_name: string;
  color_hex?: string;
  price_modifier: number;
  stock_quantity: number;
  model: {
    id: string;
    name: string;
    slug: string;
    model_number?: string;
    screen_size?: number;
    brand: {
      id: string;
      name: string;
      slug: string;
    };
  };
  product_type: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    description?: string;
    material_properties?: any;
  };
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const variantId = params.id as string;
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (variantId) {
      fetchProduct();
    }
  }, [variantId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/variants/${variantId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product');
      }
      
      setProduct(data.variant);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      setAdding(true);
      setError('');
      await addToCart(variantId, undefined, quantity);
      router.push('/cart');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const totalPrice = product 
    ? (parseFloat(product.product_type.base_price.toString()) + parseFloat(product.price_modifier.toString())) * quantity
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📱</div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Product not found
            </h2>
            <p className="text-gray-600 mb-6">{error || 'This product does not exist'}</p>
            <Link href="/products">
              <Button className="h-11">Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const inStock = product.stock_quantity > 0;
  const unitPrice = parseFloat(product.product_type.base_price.toString()) + parseFloat(product.price_modifier.toString());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <Link href="/products">
              <Button variant="outline" size="sm">← Back</Button>
            </Link>
            <Link href="/cart">
              <Button variant="outline" size="sm">🛒 Cart</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Product Image */}
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg relative overflow-hidden">
            {product.color_hex && (
              <div
                className="absolute inset-0 opacity-20"
                style={{ backgroundColor: product.color_hex }}
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-9xl">📱</div>
            </div>
            {!inStock && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                Out of Stock
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {product.model.brand.name} {product.model.name}
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                {product.product_type.name} Case
              </p>
            </div>

            {/* Price */}
            <div className="border-t border-b py-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">
                  ${unitPrice.toFixed(2)}
                </span>
                <span className="text-gray-500">per case</span>
              </div>
            </div>

            {/* Color */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Color</h3>
              <div className="flex items-center gap-3">
                {product.color_hex && (
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-300"
                    style={{ backgroundColor: product.color_hex }}
                  />
                )}
                <span className="text-lg text-gray-700">{product.color_name}</span>
              </div>
            </div>

            {/* Description */}
            {product.product_type.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{product.product_type.description}</p>
              </div>
            )}

            {/* Material Properties */}
            {product.product_type.material_properties && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Material Properties</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(product.product_type.material_properties).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-medium text-gray-900 capitalize">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Model Information</h3>
              <div className="space-y-1 text-sm">
                {product.model.model_number && (
                  <p className="text-gray-700">Model: {product.model.model_number}</p>
                )}
                {product.model.screen_size && (
                  <p className="text-gray-700">Screen Size: {product.model.screen_size}"</p>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div>
              <p className={`text-sm font-medium ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                {inStock ? `${product.stock_quantity} in stock` : 'Out of stock'}
              </p>
            </div>

            {/* Quantity & Add to Cart */}
            {inStock && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg w-32">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-3 hover:bg-gray-100 transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val > 0 && val <= product.stock_quantity) {
                            setQuantity(val);
                          }
                        }}
                        className="w-full text-center border-0 border-x py-3"
                        min="1"
                        max={product.stock_quantity}
                      />
                      <button
                        onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                        className="px-4 py-3 hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handleAddToCart}
                    disabled={adding}
                    className="w-full h-12 text-base"
                  >
                    {adding ? 'Adding...' : 'Add to Cart'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-8">
          <RelatedProducts
            variantId={variantId}
            limit={4}
            onAddToCart={async (vid) => {
              try {
                await addToCart(vid);
                router.push('/cart');
              } catch (err: any) {
                console.error('Failed to add to cart:', err);
              }
            }}
          />
        </div>
      </main>
    </div>
  );
}
