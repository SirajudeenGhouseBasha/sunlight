'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { useCart } from '@/src/context/CartContext';
import { ShoppingBag, Zap, Sparkles } from 'lucide-react';

interface ProductActionsProps {
  variantId: string;
  designId?: string;
  isPredesigned?: boolean;
  predesignedProductId?: string;
  /** Compact horizontal layout for the mobile sticky bar */
  compact?: boolean;
}

export function ProductActions({ variantId, designId, isPredesigned = false, predesignedProductId, compact = false }: ProductActionsProps) {
  const router = useRouter();
  const { addToCart, refreshCart, loading: cartLoading } = useCart();
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    setAdding(true);
    setError(null);
    try {
      await addToCart(variantId, designId, 1, undefined, predesignedProductId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add to cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    setBuying(true);
    setError(null);
    try {
      await addToCart(variantId, designId, 1, undefined, predesignedProductId);
      await refreshCart();
      router.push('/checkout');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete purchase.');
      setBuying(false);
    }
  };

  const isLoading = adding || buying || cartLoading;

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      <div className={compact ? "flex items-center gap-2" : "flex flex-col sm:flex-row gap-2 sm:gap-3"}>
        <Button
          size="lg"
          className={compact
            ? "flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm gap-2 shadow-sm"
            : "flex-1 h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base gap-2 shadow-sm"}
          onClick={handleAddToCart}
          disabled={isLoading}
        >
          {adding ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          {adding ? 'Adding...' : 'Add to Cart'}
        </Button>
        <Button
          size="lg"
          className={compact
            ? "flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm gap-2 shadow-sm"
            : "flex-1 h-12 sm:h-14 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm sm:text-base gap-2 shadow-sm"}
          onClick={handleBuyNow}
          disabled={isLoading}
        >
          {buying ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          {buying ? 'Processing...' : 'Buy Now'}
        </Button>
      </div>
      {!isPredesigned && !compact && (
        <a href={`/products/${variantId}?customize=true`} className="block">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-11 sm:h-12 border-orange-300 text-orange-600 hover:bg-orange-50 font-medium text-sm gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Customize This Case
          </Button>
        </a>
      )}
    </div>
  );
}
