/**
 * Checkout Page
 * 
 * Order creation with shipping/billing information
 * Requirements: 6.4, 6.5 - Order creation
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/src/context/CartContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, summary, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
  });
  
  const [billingAddress, setBillingAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
  });
  
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_address: shippingAddress,
          billing_address: sameAsShipping ? shippingAddress : billingAddress,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Clear cart and redirect to order confirmation
      await clearCart();
      router.push(`/orders/${data.order.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add items to your cart before checking out
            </p>
            <Link href="/dashboard">
              <Button className="h-11">Start Shopping</Button>
            </Link>
          </CardContent>
        </Card>
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
              <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
              <p className="text-sm text-gray-600 mt-1">Complete your order</p>
            </div>
            <Link href="/cart">
              <Button variant="outline" size="sm">← Back to Cart</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shipping_street">Street Address *</Label>
                <Input
                  id="shipping_street"
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                  placeholder="123 Main St"
                  required
                  className="h-11 mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shipping_city">City *</Label>
                  <Input
                    id="shipping_city"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    placeholder="New York"
                    required
                    className="h-11 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="shipping_state">State/Province *</Label>
                  <Input
                    id="shipping_state"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    placeholder="NY"
                    required
                    className="h-11 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shipping_country">Country *</Label>
                  <Input
                    id="shipping_country"
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                    placeholder="United States"
                    required
                    className="h-11 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="shipping_postal">Postal Code *</Label>
                  <Input
                    id="shipping_postal"
                    value={shippingAddress.postal_code}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                    placeholder="10001"
                    required
                    className="h-11 mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="same_as_shipping"
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <Label htmlFor="same_as_shipping" className="cursor-pointer">
                  Same as shipping address
                </Label>
              </div>

              {!sameAsShipping && (
                <>
                  <div>
                    <Label htmlFor="billing_street">Street Address *</Label>
                    <Input
                      id="billing_street"
                      value={billingAddress.street}
                      onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
                      placeholder="123 Main St"
                      required
                      className="h-11 mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billing_city">City *</Label>
                      <Input
                        id="billing_city"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                        placeholder="New York"
                        required
                        className="h-11 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_state">State/Province *</Label>
                      <Input
                        id="billing_state"
                        value={billingAddress.state}
                        onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                        placeholder="NY"
                        required
                        className="h-11 mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billing_country">Country *</Label>
                      <Input
                        id="billing_country"
                        value={billingAddress.country}
                        onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })}
                        placeholder="United States"
                        required
                        className="h-11 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_postal">Postal Code *</Label>
                      <Input
                        id="billing_postal"
                        value={billingAddress.postal_code}
                        onChange={(e) => setBillingAddress({ ...billingAddress, postal_code: e.target.value })}
                        placeholder="10001"
                        required
                        className="h-11 mt-1"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Order Notes (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for your order..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg resize-none"
              />
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({summary?.item_count})</span>
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
