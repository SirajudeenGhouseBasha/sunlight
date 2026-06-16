'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/src/context/CartContext';
import { LocationPicker } from '@/src/components/map/LocationPicker';
import type { LocationData } from '@/src/components/map/LocationPicker';

interface UpiConfig {
  upi_id: string;
  phone: string;
  qr_code_url: string;
  merchant_name: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, summary, clearCart, refreshCart, loading: cartLoading } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
  });

  const [deliveryLocation, setDeliveryLocation] = useState<LocationData | null>(null);
  const [upiConfig, setUpiConfig] = useState<UpiConfig | null>(null);
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState('');

  const [step, setStep] = useState<'info' | 'payment' | 'confirm'>('info');

  useEffect(() => {
    refreshCart();
    fetchUpiConfig();
  }, [refreshCart]);

  const fetchUpiConfig = async () => {
    try {
      const res = await fetch('/api/settings/upi');
      if (res.ok) {
        const data = await res.json();
        setUpiConfig(data);
      }
    } catch {
      // Use defaults if fetch fails
    }
  };

  const handleScreenshotUpload = async (file: File) => {
    setScreenshotUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/payment-screenshot', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setScreenshotUrl(data.url);
    } catch {
      setError('Failed to upload screenshot. Please try again.');
    } finally {
      setScreenshotUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail || undefined,
            shipping_address: shippingAddress,
            delivery_location: deliveryLocation || undefined,
            notes: '',
            payment_method: 'upi',
            upi_transaction_id: upiTransactionId,
            payment_screenshot_url: screenshotUrl || undefined,
          }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      await clearCart();
      router.push(`/orders/${data.order.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛒</div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

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

  const totalAmount = parseFloat(summary?.subtotal || '0');

  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Step Indicator */}
      <div className="px-4 sm:px-6 max-w-4xl mx-auto pt-4">
        <div className="flex items-center gap-2 text-sm">
          <span className={`px-3 py-1 rounded-full ${step === 'info' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}>1. Info</span>
          <div className="h-px flex-1 bg-gray-300" />
          <span className={`px-3 py-1 rounded-full ${step === 'payment' ? 'bg-green-600 text-white' : step === 'confirm' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>2. Pay</span>
          <div className="h-px flex-1 bg-gray-300" />
          <span className={`px-3 py-1 rounded-full ${step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>3. Confirm</span>
        </div>
      </div>

      <main className="px-4 py-6 sm:px-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* STEP 1: Customer Info + Shipping */}
          {step === 'info' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="h-11 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+919876543210"
                      required
                      className="h-11 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="h-11 mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

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

                  <hr className="border-neutral-100" />

                  <LocationPicker
                    onLocationChange={setDeliveryLocation}
                  />
                </CardContent>
              </Card>

              <Button
                type="button"
                onClick={() => {
                  if (!customerName || !customerPhone || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.country || !shippingAddress.postal_code) {
                    setError('Please fill in all required fields');
                    return;
                  }
                  setError('');
                  setStep('payment');
                }}
                className="w-full h-12 text-base"
              >
                Continue to Payment
              </Button>
            </>
          )}

          {/* STEP 2: UPI Payment */}
          {step === 'payment' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Pay via UPI</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                    <p className="text-4xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</p>
                  </div>

                  {/* UPI Details */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                    {upiConfig?.qr_code_url && (
                      <div className="flex justify-center">
                        <img
                          src={upiConfig.qr_code_url}
                          alt="UPI QR Code"
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">UPI ID:</span>
                        <span className="font-mono font-medium text-gray-900">{upiConfig?.upi_id || 'sunlightcases@upi'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-mono font-medium text-gray-900">{upiConfig?.phone || '+919999999999'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Merchant:</span>
                        <span className="font-medium text-gray-900">{upiConfig?.merchant_name || 'Sunlight Cases'}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 text-center">
                    Open your UPI app (Google Pay, PhonePe, PayTM, etc.) and make a payment of{' '}
                    <strong>₹{totalAmount.toFixed(2)}</strong> to the UPI ID or scan the QR code above.
                  </p>

                  <hr />

                  {/* Transaction ID */}
                  <div>
                    <Label htmlFor="txn_id">UPI Transaction / Reference ID *</Label>
                    <Input
                      id="txn_id"
                      value={upiTransactionId}
                      onChange={(e) => setUpiTransactionId(e.target.value)}
                      placeholder="Enter the transaction ID from your UPI app"
                      required
                      className="h-11 mt-1"
                    />
                  </div>

                  {/* Screenshot */}
                  <div>
                    <Label htmlFor="screenshot">Payment Screenshot (optional)</Label>
                    <input
                      id="screenshot"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPaymentScreenshot(file);
                          handleScreenshotUpload(file);
                        }
                      }}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    {screenshotUploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                    {screenshotUrl && <p className="text-sm text-green-600 mt-1">✓ Screenshot uploaded</p>}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('info')}
                  className="w-1/3 h-12"
                >
                  ← Back
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!upiTransactionId) {
                      setError('Please enter the UPI transaction ID');
                      return;
                    }
                    setError('');
                    setStep('confirm');
                  }}
                  className="flex-1 h-12 text-base"
                >
                  Continue to Review
                </Button>
              </div>
            </>
          )}

          {/* STEP 3: Confirmation */}
          {step === 'confirm' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Customer</h3>
                    <div className="text-sm text-gray-700 space-y-1 bg-gray-50 rounded-lg p-3">
                      <p><span className="font-medium">Name:</span> {customerName}</p>
                      <p><span className="font-medium">Phone:</span> {customerPhone}</p>
                      {customerEmail && <p><span className="font-medium">Email:</span> {customerEmail}</p>}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                    <div className="text-sm text-gray-700 space-y-1 bg-gray-50 rounded-lg p-3">
                      <p>{shippingAddress.street}</p>
                      <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
                      <p>{shippingAddress.country}</p>
                    </div>
                  </div>

                  {deliveryLocation && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Drop Location</h3>
                      <div className="text-sm text-gray-700 space-y-1 bg-gray-50 rounded-lg p-3">
                        <p className="line-clamp-2">{deliveryLocation.address}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {deliveryLocation.lat.toFixed(6)}, {deliveryLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
                    <div className="text-sm text-gray-700 space-y-1 bg-gray-50 rounded-lg p-3">
                      <p><span className="font-medium">Method:</span> UPI</p>
                      <p><span className="font-medium">Transaction ID:</span> {upiTransactionId}</p>
                      {screenshotUrl && <p><span className="font-medium">Screenshot:</span> ✓ Attached</p>}
                      <p className="text-lg font-bold text-gray-900 mt-2">Total: ₹{totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    Your order will be placed with <strong>Pending Payment Verification</strong> status. We will verify your payment and update the status once confirmed.
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('payment')}
                  className="w-1/3 h-12"
                >
                  ← Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 text-base"
                >
                  {loading ? 'Processing...' : "I've Paid — Place Order"}
                </Button>
              </div>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
