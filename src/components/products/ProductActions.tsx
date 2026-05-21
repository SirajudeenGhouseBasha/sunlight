'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';

interface ProductActionsProps {
  variantId: string;
  designId?: string;
  isPredesigned?: boolean;
}

export function ProductActions({ variantId, designId, isPredesigned = false }: ProductActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: any = { variant_id: variantId, quantity: 1 };
      
      // For predesigned products, add the predesigned_product_id
      if (isPredesigned) {
        body.predesigned_product_id = variantId;
      }
      
      // Add design_id if provided
      if (designId) {
        body.design_id = designId;
      }
      
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to add item to cart');
      alert('Successfully added case to cart!');
    } catch (err) {
      setError('Could not add to cart.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: any = { variant_id: variantId, quantity: 1 };
      
      // For predesigned products, add the predesigned_product_id
      if (isPredesigned) {
        body.predesigned_product_id = variantId;
      }
      
      // Add design_id if provided
      if (designId) {
        body.design_id = designId;
      }
      
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to buy item');
      router.push('/cart');
    } catch (err) {
      setError('Could not complete purchase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button
        size="lg"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        onClick={handleAddToCart}
        disabled={loading}
      >
        {loading ? 'Adding...' : 'Add to Cart'}
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="w-full text-blue-600 border-blue-600 hover:bg-blue-50 font-semibold"
        onClick={handleBuyNow}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Buy Now'}
      </Button>
      {!isPredesigned && (
        <a href={`/products/${variantId}?customize=true`}>
          <Button
            variant="outline"
            size="lg"
            className="w-full mt-2 border-orange-300 text-orange-600 hover:bg-orange-50 font-semibold"
          >
            🎨 Customize This Case
          </Button>
        </a>
      )}
    </div>
  );
}
