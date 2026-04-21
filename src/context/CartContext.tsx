/**
 * Cart Context
 * 
 * Global cart state management with persistence
 * Requirements: 6.1, 6.2 - Cart state management
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface CartItem {
  id: string;
  variant_id: string;
  design_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customization_options?: any;
  variant?: any;
  design?: any;
  created_at: string;
  updated_at: string;
}

export interface CartSummary {
  subtotal: string;
  item_count: number;
}

interface CartContextType {
  cartItems: CartItem[];
  summary: CartSummary | null;
  loading: boolean;
  error: string | null;
  addToCart: (variantId: string, designId?: string, quantity?: number, customization?: any) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/cart');
      
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, clear cart
          setCartItems([]);
          setSummary(null);
          return;
        }
        throw new Error('Failed to fetch cart');
      }

      const data = await response.json();
      setCartItems(data.cart_items || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message);
      setCartItems([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(
    async (
      variantId: string,
      designId?: string,
      quantity: number = 1,
      customization?: any
    ) => {
      try {
        setError(null);

        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variant_id: variantId,
            design_id: designId,
            quantity,
            customization_options: customization,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add to cart');
        }

        await refreshCart();
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [refreshCart]
  );

  const updateCartItem = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        setError(null);

        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update cart item');
        }

        await refreshCart();
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [refreshCart]
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      try {
        setError(null);

        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to remove from cart');
        }

        await refreshCart();
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [refreshCart]
  );

  const clearCart = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear cart');
      }

      setCartItems([]);
      setSummary(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Load cart on mount
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const value: CartContextType = {
    cartItems,
    summary,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
