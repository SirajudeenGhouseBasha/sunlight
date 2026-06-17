'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import Link from 'next/link';
import { Package, ChevronRight, Search } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳' },
  PAID: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '✓' },
  PROCESSING: { label: 'Processing', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '⚙' },
  SHIPPED: { label: 'Shipped', color: 'bg-green-100 text-green-800 border-green-200', icon: '🚚' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-200', icon: '📦' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: '✕' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch orders');
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3 sm:px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">My Orders</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track and manage your orders</p>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">← Home</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 sm:px-6 max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
        )}

        {orders.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 sm:py-16 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                You haven't placed any orders yet. Start shopping to see your orders here!
              </p>
              <Link href="/">
                <Button className="h-11 px-8">Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-gray-500">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </p>
            {orders.map((order) => {
              const config = statusConfig[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '•' };
              return (
                <Link key={order.id} href={`/orders/${order.id}`} className="block">
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                              Order #{order.order_number}
                            </span>
                            <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full border font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </p>
                          <p className="text-base sm:text-lg font-bold text-gray-900 mt-2">
                            ₹{parseFloat(order.total_amount.toString()).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 group-hover:text-orange-600 transition-colors mt-1 shrink-0">
                          <span className="text-xs hidden sm:inline">View</span>
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
