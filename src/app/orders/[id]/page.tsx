/**
 * Order Details Page
 * 
 * View detailed order information
 * Requirements: 6.4, 13.1, 13.2 - Order details and tracking
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string;
  design_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  design?: {
    image_url: string;
    thumbnail_url?: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  total_amount: number;
  shipping_address: any;
  billing_address: any;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  items: OrderItem[];
}

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order');
      }
      
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      printing: 'bg-purple-100 text-purple-800',
      shipping: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Order not found
            </h2>
            <p className="text-gray-600 mb-6">{error || 'This order does not exist'}</p>
            <Link href="/orders">
              <Button className="h-11">View All Orders</Button>
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
              <h1 className="text-xl font-bold text-gray-900">
                Order #{order.order_number}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <Link href="/orders">
              <Button variant="outline" size="sm">← All Orders</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 max-w-4xl mx-auto">
        <div className="space-y-4">
          
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
                <span className="text-sm text-gray-600">
                  Payment: {order.payment_status}
                </span>
              </div>
              {order.tracking_number && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900">
                    Tracking Number: {order.tracking_number}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-3 border-b last:border-0 last:pb-0">
                  {item.design && (
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={item.design.thumbnail_url || item.design.image_url}
                        alt={item.design_name || 'Design'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.variant_name}</p>
                    {item.design_name && (
                      <p className="text-sm text-gray-500 mt-1">Design: {item.design_name}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-2">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ${parseFloat(item.total_price.toString()).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      ${parseFloat(item.unit_price.toString()).toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700 space-y-1">
                <p>{order.shipping_address.street}</p>
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state}{' '}
                  {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  ${parseFloat(order.subtotal.toString()).toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${parseFloat(order.total_amount.toString()).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
