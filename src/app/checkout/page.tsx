'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/src/context/CartContext';
import { LocationPicker } from '@/src/components/map/LocationPicker';
import type { LocationData } from '@/src/components/map/LocationPicker';
import { ChevronLeft, ChevronRight, Check, CreditCard, MapPin, User, Package, X, ExternalLink } from 'lucide-react';

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

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
    } catch {}
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
      setPlacedOrderId(data.order.id);
      setShowSuccessModal(true);
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add items to your cart before checking out</p>
            <Link href="/dashboard"><Button className="h-11">Start Shopping</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAmount = parseFloat(summary?.subtotal || '0');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/cart" className="sm:hidden">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Checkout</h1>
                <p className="text-xs sm:text-sm text-gray-500">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <Link href="/cart" className="hidden sm:block">
              <Button variant="outline" size="sm">← Back to Cart</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="px-4 sm:px-6 max-w-4xl mx-auto pt-4 sm:pt-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-colors ${
            step === 'info' ? 'bg-green-600 text-white' : step === 'payment' || step === 'confirm' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
          }`}>
            <User className="w-3 h-3" />
            <span className="hidden sm:inline">Info</span>
          </span>
          <div className="flex-1 h-px bg-gray-300" />
          <span className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-colors ${
            step === 'payment' ? 'bg-green-600 text-white' : step === 'confirm' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
          }`}>
            <CreditCard className="w-3 h-3" />
            <span className="hidden sm:inline">Payment</span>
          </span>
          <div className="flex-1 h-px bg-gray-300" />
          <span className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-colors ${
            step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            <Package className="w-3 h-3" />
            <span className="hidden sm:inline">Review</span>
          </span>
        </div>
      </div>

      <main className="px-4 py-4 sm:px-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {/* STEP 1: Customer Info */}
          {step === 'info' && (
            <>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-base sm:text-lg">Customer Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm">Full Name *</Label>
                    <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Doe" required className="h-11 mt-1" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                      <Input id="phone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+919876543210" required className="h-11 mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm">Email (optional)</Label>
                      <Input id="email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="john@example.com" className="h-11 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-base sm:text-lg">Shipping Address</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="shipping_street" className="text-sm">Street Address *</Label>
                    <Input id="shipping_street" value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                      placeholder="123 Main St" required className="h-11 mt-1" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="shipping_city" className="text-sm">City *</Label>
                      <Input id="shipping_city" value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        placeholder="Mumbai" required className="h-11 mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="shipping_state" className="text-sm">State *</Label>
                      <Input id="shipping_state" value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        placeholder="Maharashtra" required className="h-11 mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="shipping_postal" className="text-sm">Postal Code *</Label>
                      <Input id="shipping_postal" value={shippingAddress.postal_code}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                        placeholder="400001" required className="h-11 mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="shipping_country" className="text-sm">Country *</Label>
                      <Input id="shipping_country" value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                        placeholder="India" required className="h-11 mt-1" />
                    </div>
                  </div>
                  <hr className="border-neutral-100" />
                  <LocationPicker onLocationChange={setDeliveryLocation} />
                </CardContent>
              </Card>

              <Button type="button" onClick={() => {
                if (!customerName || !customerPhone || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.country || !shippingAddress.postal_code) {
                  setError('Please fill in all required fields'); return;
                }
                setError(''); setStep('payment');
              }} className="w-full h-12 text-base gap-2">
                Continue to Payment <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* STEP 2: Payment */}
          {step === 'payment' && (
            <>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-base sm:text-lg">Pay via UPI</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                    <p className="text-3xl sm:text-4xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-4">
                    {upiConfig?.qr_code_url && (
                      <div className="flex justify-center">
                        <img src={upiConfig.qr_code_url} alt="UPI QR Code" className="w-40 sm:w-48 h-40 sm:h-48 object-contain" />
                      </div>
                    )}
                    <div className="space-y-2 text-xs sm:text-sm bg-white rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">UPI ID:</span>
                        <span className="font-mono font-semibold text-gray-900">{upiConfig?.upi_id || 'sunlightcases@upi'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-mono font-semibold text-gray-900">{upiConfig?.phone || '+919999999999'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Merchant:</span>
                        <span className="font-semibold text-gray-900">{upiConfig?.merchant_name || 'Sunlight Cases'}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 text-center">
                    Open your UPI app and pay <strong>₹{totalAmount.toFixed(2)}</strong> to the ID above or scan the QR code.
                  </p>

                  <hr className="border-gray-200" />

                  <div>
                    <Label htmlFor="txn_id" className="text-sm">UPI Transaction ID *</Label>
                    <Input id="txn_id" value={upiTransactionId} onChange={(e) => setUpiTransactionId(e.target.value)}
                      placeholder="Enter transaction ID from your UPI app" required className="h-11 mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="screenshot" className="text-sm">Payment Screenshot (recommended)</Label>
                    <div className="mt-1 flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm text-gray-600">
                        <input id="screenshot" type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) { setPaymentScreenshot(file); handleScreenshotUpload(file); }
                          }}
                          className="hidden" />
                        {screenshotUploading ? 'Uploading...' : 'Choose File'}
                      </label>
                      {screenshotUrl && <span className="flex items-center gap-1 text-sm text-green-600"><Check className="w-4 h-4" /> Uploaded</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep('info')} className="w-1/3 h-12">← Back</Button>
                <Button type="button" onClick={() => {
                  if (!upiTransactionId) { setError('Please enter the UPI transaction ID'); return; }
                  setError(''); setStep('confirm');
                }} className="flex-1 h-12 text-base gap-2">
                  Review Order <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}

          {/* STEP 3: Review */}
          {step === 'confirm' && (
            <>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Review Your Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <User className="w-4 h-4 text-green-600" /> Customer Details
                    </div>
                    <div className="text-xs sm:text-sm text-gray-700 space-y-1 pl-6">
                      <p><span className="font-medium">Name:</span> {customerName}</p>
                      <p><span className="font-medium">Phone:</span> {customerPhone}</p>
                      {customerEmail && <p><span className="font-medium">Email:</span> {customerEmail}</p>}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <MapPin className="w-4 h-4 text-green-600" /> Shipping Address
                    </div>
                    <div className="text-xs sm:text-sm text-gray-700 space-y-1 pl-6">
                      <p>{shippingAddress.street}</p>
                      <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
                      <p>{shippingAddress.country}</p>
                    </div>
                  </div>

                  {deliveryLocation && (
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <MapPin className="w-4 h-4 text-green-600" /> Drop Location
                      </div>
                      <div className="text-xs sm:text-sm text-gray-700 pl-6">
                        <p className="line-clamp-2">{deliveryLocation.address}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <CreditCard className="w-4 h-4 text-green-600" /> Payment
                    </div>
                    <div className="text-xs sm:text-sm text-gray-700 space-y-1 pl-6">
                      <p><span className="font-medium">Method:</span> UPI</p>
                      <p><span className="font-medium">Transaction ID:</span> {upiTransactionId}</p>
                      {screenshotUrl && <p><span className="font-medium">Screenshot:</span> ✓ Attached</p>}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                    <span className="font-semibold text-gray-900 text-sm">Total Amount</span>
                    <span className="text-xl sm:text-2xl font-bold text-green-700">₹{totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs sm:text-sm text-yellow-800">
                    Your order will be placed with <strong>Pending Payment Verification</strong> status. We will verify your payment and update the status once confirmed.
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep('payment')} className="w-1/3 h-12">← Back</Button>
                <Button type="submit" disabled={loading} className="flex-1 h-12 text-base">
                  {loading ? 'Processing...' : "I've Paid — Place Order"}
                </Button>
              </div>
            </>
          )}
        </form>
      </main>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed! 🎉</h2>
              <p className="text-gray-600 mb-6">
                Your order has been placed successfully. We will verify your payment and update the status soon.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Order ID</span>
                <span className="text-sm font-semibold text-gray-900">#{placedOrderId?.slice(0, 8)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Amount</span>
                <span className="text-lg font-bold text-green-700">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment</span>
                <span className="text-sm font-semibold text-yellow-600">Pending Verification</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push(`/orders/${placedOrderId}`)}
                className="w-full h-12 text-base gap-2"
              >
                View Order Details
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/products')}
                className="w-full h-12 text-base"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
