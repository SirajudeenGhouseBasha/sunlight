/**
 * Shopping Cart Page
 * 
 * View and manage cart items
 * Requirements: 6.1, 6.2, 6.3 - Cart management
 */

'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import Link from 'next/link';
import { useCart } from '@/src/context/CartContext';

export default function CartPage() {
  const {
    cartItems,
    summary,
    loading,
    error,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
  } = useCart();

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (err) {
      // Error handled by context
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!confirm('Remove this item from cart?')) return;
    try {
      await removeFromCart(itemId);
    } catch (err) {
      // Error handled by context
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Clear entire cart?')) return;
    try {
      await clearCart();
    } catch (err) {
      // Error handled by context
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛒</div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-sm text-gray-600 mt-1">
                {summary?.item_count || 0} {summary?.item_count === 1 ? 'item' : 'items'}
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">← Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 max-w-6xl mx-auto">
        <div className="space-y-4">
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Empty Cart */}
          {cartItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Your cart is empty
                </h2>
                <p className="text-gray-600 mb-6">
                  Add some phone cases to get started!
                </p>
                <Link href="/dashboard">
                  <Button className="h-11">Start Shopping</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Cart Items ({cartItems.length})
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearCart}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear Cart
                  </Button>
                </div>

                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Design Preview */}
                        {item.design && (
                          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={item.design.thumbnail_url || item.design.image_url}
                              alt={item.design.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {item.variant?.model?.brand?.name} {item.variant?.model?.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.variant?.product_type?.name} - {item.variant?.color_name}
                          </p>
                          {item.design && (
                            <p className="text-sm text-gray-500 mt-1">
                              Design: {item.design.name}
                            </p>
                          )}
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="px-3 py-2 hover:bg-gray-100 transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                −
                              </button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (val > 0) handleQuantityChange(item.id, val);
                                }}
                                className="w-16 h-9 text-center border-0 border-x"
                                min="1"
                              />
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="px-3 py-2 hover:bg-gray-100 transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemove(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ${parseFloat(item.total_price.toString()).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            ${parseFloat(item.unit_price.toString()).toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">${summary?.subtotal}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-2xl font-bold text-blue-600">
                          ${summary?.subtotal}
                        </span>
                      </div>
                    </div>

                    <Link href="/checkout" className="block">
                      <Button className="w-full h-12 text-base">
                        Proceed to Checkout
                      </Button>
                    </Link>

                    <Link href="/dashboard" className="block">
                      <Button variant="outline" className="w-full h-11">
                        Continue Shopping
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
