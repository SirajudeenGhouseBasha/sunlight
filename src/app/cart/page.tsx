'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import Link from 'next/link';
import { useCart } from '@/src/context/CartContext';
import { ShoppingBag, Trash2, Minus, Plus, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function CartPage() {
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

  useEffect(() => { refreshCart(); }, [refreshCart]);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try { await updateCartItem(itemId, newQuantity); } catch {}
  };

  const handleRemove = async (itemId: string) => {
    if (!confirm('Remove this item from cart?')) return;
    try { await removeFromCart(itemId); } catch {}
  };

  const handleClearCart = async () => {
    if (!confirm('Clear entire cart?')) return;
    try { await clearCart(); } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3 sm:px-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="sm:hidden">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Shopping Cart</h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {summary?.item_count || 0} {summary?.item_count === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            <Link href="/dashboard" className="hidden sm:block">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 sm:px-6 max-w-6xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
        )}

        {!isLoggedIn && cartItems.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg text-sm mb-4 flex items-center justify-between gap-3 flex-wrap">
            <span>
              You're shopping as a guest. <Link href="/auth/login?redirectTo=/cart" className="font-semibold underline">Log in</Link> to save your cart and place orders.
            </span>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-sm text-gray-500 mb-6">Add some phone cases to get started!</p>
              <Link href="/dashboard">
                <Button className="h-11 px-8">Start Shopping</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Cart Items ({cartItems.length})
                </h2>
                <button
                  onClick={handleClearCart}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              </div>

              {cartItems.map((item) => (
                <Card key={item.id} className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      {/* Design Preview */}
                      {item.design || item.image_url ? (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={item.design ? (item.design.thumbnail_url || item.design.image_url) : (item.image_url || '')}
                            alt={item.design?.name || item.name || 'Cart item'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                        </div>
                      )}

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                              {item.name || `${item.variant?.model?.brand?.name || ''} ${item.variant?.model?.name || item.model?.name || ''}`.trim()}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                              {item.variant?.product_type?.name || item.product_type?.name}
                              {item.variant?.color_name ? ` - ${item.variant.color_name}` : ''}
                            </p>
                            {item.design && (
                              <p className="text-xs text-gray-400 mt-0.5">Design: {item.design.name}</p>
                            )}
                          </div>
                          {/* Price on mobile - top right */}
                          <div className="text-right shrink-0">
                            <p className="text-sm sm:text-base font-bold text-gray-900">
                              ₹{parseFloat(item.total_price.toString()).toFixed(2)}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-400">
                              ₹{parseFloat(item.unit_price.toString()).toFixed(2)} each
                            </p>
                          </div>
                        </div>

                        {/* Quantity + Remove */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="px-2.5 py-1.5 sm:px-3 sm:py-2 hover:bg-gray-50 transition-colors disabled:opacity-30"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <span className="w-8 sm:w-10 text-center text-xs sm:text-sm font-medium border-x border-gray-200 py-1.5 sm:py-2">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="px-2.5 py-1.5 sm:px-3 sm:py-2 hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="text-red-500 hover:text-red-700 text-xs sm:text-sm font-medium flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium text-gray-900">₹{summary?.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 sm:pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base sm:text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-xl sm:text-2xl font-bold text-orange-600">
                        ₹{summary?.subtotal}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
                  </div>

                  <Link href={isLoggedIn ? '/checkout' : '/auth/login?redirectTo=/checkout'} className="block">
                    <Button className="w-full h-11 sm:h-12 text-sm sm:text-base gap-2">
                      {isLoggedIn ? 'Proceed to Checkout' : 'Login to Checkout'} <ShoppingBag className="w-4 h-4" />
                    </Button>
                  </Link>

                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500 justify-center">
                    <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" />
                    Secure checkout with UPI payment
                  </div>

                  <Link href="/dashboard" className="block">
                    <Button variant="outline" className="w-full h-10 text-xs sm:text-sm">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
