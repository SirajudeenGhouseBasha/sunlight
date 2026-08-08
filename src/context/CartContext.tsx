/**
 * Cart Context
 *
 * Global cart state management with persistence.
 * - Authenticated users: cart is stored in Supabase (cart_items) via /api/cart.
 * - Guests: cart lives in localStorage and is merged into the account on login.
 * Requirements: 6.1, 6.2 - Cart state management
 */

'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { supabase } from '@/src/lib/supabase/client';

export interface CartItemVariant {
  id: string;
  name: string;
  color_name: string;
  color_hex?: string | null;
  price_modifier: number;
  stock_quantity: number;
  is_active: boolean;
  model: {
    id: string;
    name: string;
    slug: string;
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
  };
}

export interface CartItemDesign {
  id: string;
  name: string;
  image_url: string;
  thumbnail_url?: string | null;
}

export interface CartItemModel {
  id: string;
  name: string;
  slug: string;
  brand?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface CartItem {
  id: string;
  variant_id: string;
  design_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customization_options?: Record<string, unknown> | null;
  variant?: CartItemVariant | null;
  design?: CartItemDesign | null;
  model?: CartItemModel | null;
  product_type?: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
  } | null;
  name?: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartSummary {
  subtotal: string;
  item_count: number;
}

export interface GuestCartItem {
  id: string;
  variant_id?: string | null;
  design_id?: string | null;
  predesigned_product_id?: string | null;
  quantity: number;
  customization_options?: Record<string, unknown> | null;
  name: string;
  image_url?: string | null;
  unit_price: number;
}

interface CartContextType {
  cartItems: CartItem[];
  summary: CartSummary | null;
  loading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  addToCart: (variantId: string, designId?: string, quantity?: number, customization?: Record<string, unknown>, predesignedProductId?: string) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = 'sunlight_guest_cart';

function loadGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? (JSON.parse(raw) as GuestCartItem[]) : [];
  } catch {
    return [];
  }
}

function persistGuestCart(items: GuestCartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // Storage may be unavailable (private mode) — guest cart is best-effort
  }
}

function guestSignature(item: Pick<GuestCartItem, 'variant_id' | 'design_id' | 'predesigned_product_id' | 'customization_options'>): string {
  return [
    item.variant_id ?? '',
    item.design_id ?? '',
    item.predesigned_product_id ?? '',
    JSON.stringify(item.customization_options ?? null),
  ].join('|');
}

async function fetchGuestSnapshot(entry: { variant_id?: string | null; predesigned_product_id?: string | null }): Promise<{ name: string; image_url?: string | null; unit_price: number }> {
  const fallback = { name: 'Phone Case', image_url: null as string | null, unit_price: 0 };
  try {
    if (entry.predesigned_product_id) {
      const res = await fetch(`/api/predesigned/${entry.predesigned_product_id}`);
      if (!res.ok) return fallback;
      const data = await res.json();
      const p = data.predesigned_product;
      if (!p) return fallback;
      const name = [p.brand?.name, p.model?.name, p.product_type?.name].filter(Boolean).join(' ') || p.name || 'Phone Case';
      return {
        name,
        image_url: p.design_image_url || p.variant_image_url || null,
        unit_price: Number(p.final_price ?? 0),
      };
    }
    if (entry.variant_id) {
      const res = await fetch(`/api/variants/${entry.variant_id}`);
      if (!res.ok) return fallback;
      const data = await res.json();
      const v = data.variant;
      if (!v) return fallback;
      const model = Array.isArray(v.model) ? v.model[0] : v.model;
      const brand = model && (Array.isArray(model.brand) ? model.brand[0] : model.brand);
      const productType = Array.isArray(v.product_type) ? v.product_type[0] : v.product_type;
      return {
        name: [brand?.name, model?.name].filter(Boolean).join(' ') || v.name || 'Phone Case',
        image_url: v.image_url || null,
        unit_price: Number(productType?.base_price ?? 0) + Number(v.price_modifier ?? 0),
      };
    }
  } catch {
    // best-effort snapshot
  }
  return fallback;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);
  const authKnownRef = useRef(false);
  const mergeInFlightRef = useRef(false);

  // Track auth state so the cart can choose DB vs localStorage storage
  useEffect(() => {
    let mounted = true;

    const applySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsLoggedIn(!!data.session);
      authKnownRef.current = true;
    };

    applySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: { user: unknown } | null) => {
        if (!mounted) return;
        authKnownRef.current = true;
        setIsLoggedIn(!!session);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load guest cart from localStorage immediately on mount (no auth needed)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const items = loadGuestCart();
    setGuestItems(items);
    if (items.length > 0) {
      // Populate cartItems right away so pages don't flash empty
      setCartItems(items.map((g) => ({
        id: g.id,
        variant_id: g.variant_id || '',
        design_id: g.design_id || undefined,
        quantity: g.quantity,
        unit_price: g.unit_price,
        total_price: g.unit_price * g.quantity,
        customization_options: g.customization_options ?? null,
        name: g.name,
        image_url: g.image_url,
        created_at: '',
        updated_at: '',
      })));
      const subtotal = items.reduce((sum, g) => sum + g.unit_price * g.quantity, 0);
      setSummary({
        subtotal: subtotal.toFixed(2),
        item_count: items.reduce((sum, g) => sum + g.quantity, 0),
      });
    }
  }, []);

  // Merge guest cart into the account after login
  useEffect(() => {
    if (!isLoggedIn || guestItems.length === 0 || mergeInFlightRef.current) return;
    mergeInFlightRef.current = true;

    (async () => {
      try {
        for (const item of guestItems) {
          await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              variant_id: item.variant_id ?? null,
              design_id: item.design_id ?? null,
              predesigned_product_id: item.predesigned_product_id ?? null,
              quantity: item.quantity,
              customization_options: item.customization_options ?? null,
            }),
          });
        }
        if (typeof window !== 'undefined') {
          localStorage.removeItem(GUEST_CART_KEY);
        }
        setGuestItems([]);
        await refreshCart();
      } finally {
        mergeInFlightRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, guestItems]);

  const loadGuestCartState = useCallback(() => {
    const items = loadGuestCart();
    setGuestItems(items);
    setCartItems(items.map((g) => ({
      id: g.id,
      variant_id: g.variant_id || '',
      design_id: g.design_id || undefined,
      quantity: g.quantity,
      unit_price: g.unit_price,
      total_price: g.unit_price * g.quantity,
      customization_options: g.customization_options ?? null,
      name: g.name,
      image_url: g.image_url,
      created_at: '',
      updated_at: '',
    })));
    const subtotal = items.reduce((sum, g) => sum + g.unit_price * g.quantity, 0);
    setSummary({
      subtotal: subtotal.toFixed(2),
      item_count: items.reduce((sum, g) => sum + g.quantity, 0),
    });
  }, []);

  const addGuestItem = useCallback(
    async (
      variantId: string,
      designId?: string,
      quantity: number = 1,
      customization?: Record<string, unknown>,
      predesignedProductId?: string
    ) => {
      const signature = guestSignature({ variant_id: variantId, design_id: designId, predesigned_product_id: predesignedProductId, customization_options: customization });
      const snapshot = await fetchGuestSnapshot({ variant_id: variantId, predesigned_product_id: predesignedProductId });

      const current = loadGuestCart();
      const existing = current.find((g) => guestSignature(g) === signature);
      let next: GuestCartItem[];
      if (existing) {
        next = current.map((g) => g === existing ? { ...g, quantity: g.quantity + quantity } : g);
      } else {
        next = [...current, {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          variant_id: variantId || null,
          design_id: designId ?? null,
          predesigned_product_id: predesignedProductId ?? null,
          quantity,
          customization_options: customization ?? null,
          name: snapshot.name,
          image_url: snapshot.image_url,
          unit_price: snapshot.unit_price,
        }];
      }
      persistGuestCart(next);
      setGuestItems(next);
      loadGuestCartState();
    },
    [loadGuestCartState]
  );

  const updateGuestItem = useCallback(
    (itemId: string, quantity: number) => {
      const current = loadGuestCart();
      const next = current.map((g) => g.id === itemId ? { ...g, quantity } : g);
      persistGuestCart(next);
      setGuestItems(next);
      loadGuestCartState();
    },
    [loadGuestCartState]
  );

  const removeGuestItem = useCallback(
    (itemId: string) => {
      const current = loadGuestCart();
      const next = current.filter((g) => g.id !== itemId);
      persistGuestCart(next);
      setGuestItems(next);
      loadGuestCartState();
    },
    [loadGuestCartState]
  );

  const refreshCart = useCallback(async () => {
    if (!authKnownRef.current) {
      // Auth not resolved yet — wait up to 1.5s for it, then fall back to guest cart
      await new Promise<void>((resolve) => {
        const start = Date.now();
        const check = () => {
          if (authKnownRef.current || Date.now() - start > 1500) {
            resolve();
          } else {
            setTimeout(check, 30);
          }
        };
        check();
      });
    }
    if (!isLoggedIn) {
      loadGuestCartState();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/cart');

      if (!response.ok) {
        if (response.status === 401) {
          // Session lost — fall back to guest cart
          setIsLoggedIn(false);
          loadGuestCartState();
          return;
        }
        throw new Error('Failed to fetch cart');
      }

      const data = await response.json();
      setCartItems(data.cart_items || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cart');
      setCartItems([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, loadGuestCartState]);

  const addToCart = useCallback(
    async (
      variantId: string,
      designId?: string,
      quantity: number = 1,
      customization?: Record<string, unknown>,
      predesignedProductId?: string
    ) => {
      setError(null);

      if (!isLoggedIn) {
        await addGuestItem(variantId, designId, quantity, customization, predesignedProductId);
        return;
      }

      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variant_id: variantId,
            design_id: designId,
            quantity,
            customization_options: customization,
            predesigned_product_id: predesignedProductId,
          }),
        });

        if (response.status === 401) {
          // Session expired or invalid — never require login to add to cart.
          // Fall back to the guest (localStorage) cart instead.
          setIsLoggedIn(false);
          await addGuestItem(variantId, designId, quantity, customization, predesignedProductId);
          return;
        }

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add to cart');
        }

        await refreshCart();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        throw err;
      }
    },
    [isLoggedIn, addGuestItem, refreshCart]
  );

  const updateCartItem = useCallback(
    async (itemId: string, quantity: number) => {
      setError(null);

      if (!isLoggedIn) {
        updateGuestItem(itemId, quantity);
        return;
      }

      try {
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        });

        if (response.status === 401) {
          setIsLoggedIn(false);
          updateGuestItem(itemId, quantity);
          return;
        }

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update cart item');
        }

        await refreshCart();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        throw err;
      }
    },
    [isLoggedIn, updateGuestItem, refreshCart]
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      setError(null);

      if (!isLoggedIn) {
        removeGuestItem(itemId);
        return;
      }

      try {
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'DELETE',
        });

        if (response.status === 401) {
          setIsLoggedIn(false);
          removeGuestItem(itemId);
          return;
        }

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to remove from cart');
        }

        await refreshCart();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        throw err;
      }
    },
    [isLoggedIn, removeGuestItem, refreshCart]
  );

  const clearCart = useCallback(async () => {
    setError(null);

    if (!isLoggedIn) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_CART_KEY);
      }
      setGuestItems([]);
      setCartItems([]);
      setSummary(null);
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      if (response.status === 401) {
        // Session lost — treat as guest and clear the local cart
        setIsLoggedIn(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(GUEST_CART_KEY);
        }
        setGuestItems([]);
        setCartItems([]);
        setSummary(null);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear cart');
      }

      setCartItems([]);
      setSummary(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      throw err;
    }
  }, [isLoggedIn]);

  const value: CartContextType = {
    cartItems,
    summary,
    loading,
    error,
    isLoggedIn,
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
