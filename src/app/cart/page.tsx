'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/src/context/CartContext';
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ShieldCheck,
  ShoppingCart,
  Package,
} from 'lucide-react';

// Resolve a display-friendly name from either a guest item or a DB item
function getItemName(item: ReturnType<typeof useCart>['cartItems'][number]): string {
  if (item.name) return item.name;
  const brand = item.variant?.model?.brand?.name ?? item.model?.brand?.name ?? '';
  const model = item.variant?.model?.name ?? item.model?.name ?? '';
  const type = item.variant?.product_type?.name ?? item.product_type?.name ?? '';
  const combined = [brand, model, type].filter(Boolean).join(' ');
  return combined || 'Phone Case';
}

// Resolve an image from either a guest item or a DB item
function getItemImage(item: ReturnType<typeof useCart>['cartItems'][number]): string | null {
  if (item.design?.thumbnail_url) return item.design.thumbnail_url;
  if (item.design?.image_url) return item.design.image_url;
  if (item.image_url) return item.image_url;
  return null;
}

// Resolve a subtitle line
function getItemSubtitle(item: ReturnType<typeof useCart>['cartItems'][number]): string {
  const parts: string[] = [];
  const type = item.variant?.product_type?.name ?? item.product_type?.name;
  const color = item.variant?.color_name;
  const design = item.design?.name;
  if (type) parts.push(type);
  if (color) parts.push(color);
  if (design) parts.push(`Design: ${design}`);
  return parts.join(' · ');
}

export default function CartPage() {
  const router = useRouter();
  const {
    cartItems,
    summary,
    loading,
    error,
    isLoggedIn,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
  } = useCart();
  const [cartReady, setCartReady] = useState(false);

  useEffect(() => {
    refreshCart().finally(() => setCartReady(true));
  }, [refreshCart]);

  const handleQty = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    try { await updateCartItem(itemId, newQty); } catch {}
  };

  const handleRemove = async (itemId: string) => {
    if (!confirm('Remove this item?')) return;
    try { await removeFromCart(itemId); } catch {}
  };

  const handleClear = async () => {
    if (!confirm('Clear your entire cart?')) return;
    try { await clearCart(); } catch {}
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading || !cartReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your cart…</p>
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShoppingCart className="w-9 h-9 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-7">Browse our collection and find something you love.</p>
          <Link
            href="/predesigned"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            <Package className="w-4 h-4" /> Shop Now
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = parseFloat(summary?.subtotal ?? '0');
  const itemCount = summary?.item_count ?? cartItems.length;

  // ── Cart ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-bold text-gray-900 text-base flex-1">
            Cart
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
          </h1>
          {cartItems.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        {/* Guest nudge */}
        {!isLoggedIn && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <span className="text-base">👋</span>
            <span>
              Shopping as guest.{' '}
              <Link href="/auth/login?redirectTo=/cart" className="font-semibold underline underline-offset-2">
                Log in
              </Link>{' '}
              to save your order history.
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Item list ── */}
          <div className="lg:col-span-2 space-y-3">
            {cartItems.map((item) => {
              const name = getItemName(item);
              const image = getItemImage(item);
              const subtitle = getItemSubtitle(item);
              const unitPrice = parseFloat(item.unit_price.toString());
              const totalPrice = parseFloat(item.total_price.toString());

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 flex gap-3 sm:gap-4"
                >
                  {/* Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    {image ? (
                      <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-7 h-7 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{name}</p>
                        {subtitle && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="shrink-0 p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Qty stepper */}
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleQty(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-9 text-center text-sm font-medium border-x border-gray-200 h-9 flex items-center justify-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQty(item.id, item.quantity + 1)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">₹{totalPrice.toFixed(2)}</p>
                        {item.quantity > 1 && (
                          <p className="text-[11px] text-gray-400">₹{unitPrice.toFixed(2)} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Order summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <h2 className="font-bold text-gray-900 text-base mb-4">Order Summary</h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 text-right">Inclusive of all taxes</p>

              <Link href="/checkout" className="block mt-5">
                <button className="w-full h-12 bg-black text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
                  Proceed to Checkout <ShoppingBag className="w-4 h-4" />
                </button>
              </Link>

              <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                Secure checkout · UPI payment
              </div>

              <Link href="/predesigned" className="block mt-3">
                <button className="w-full h-10 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Continue Shopping
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
