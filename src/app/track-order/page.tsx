import { requireAuth } from '@/src/lib/auth/session';
import { createClient } from '@/src/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import Link from 'next/link';
import { Package, MapPin, ChevronRight } from 'lucide-react';

const STATUS_FLOW = [
  { key: 'PENDING_PAYMENT', label: 'Order Placed', icon: '📋' },
  { key: 'PAID', label: 'Payment Verified', icon: '✅' },
  { key: 'SHIPPED', label: 'Shipped', icon: '📦' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🎉' },
];

function getCurrentStep(status: string): number {
  const idx = STATUS_FLOW.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default async function TrackOrderPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_amount, created_at, tracking_number')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 sm:px-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Track My Order</h1>
              <p className="text-xs sm:text-sm text-gray-500">View real-time status of your orders</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 max-w-4xl mx-auto">
        {(!orders || orders.length === 0) ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h2>
              <p className="text-sm text-gray-500 mb-6">You haven&apos;t placed any orders yet.</p>
              <Link href="/products">
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const currentStep = getCurrentStep(order.status);
              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">#{order.order_number}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₹{parseFloat(order.total_amount.toString()).toFixed(2)}</p>
                          {order.tracking_number && (
                            <p className="text-xs text-blue-600 mt-1">Track: {order.tracking_number}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {STATUS_FLOW.map((step, idx) => {
                          const isCompleted = idx <= currentStep;
                          const isCurrent = idx === currentStep;
                          return (
                            <div key={step.key} className="flex-1 flex flex-col items-center">
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base ${
                                isCompleted
                                  ? isCurrent
                                    ? 'bg-orange-500 text-white ring-2 ring-orange-200'
                                    : 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-400'
                              }`}>
                                {step.icon}
                              </div>
                              <span className={`text-[10px] sm:text-xs mt-1.5 text-center leading-tight ${
                                isCompleted ? 'font-medium text-gray-900' : 'text-gray-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-end mt-3">
                        <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                          View Details <ChevronRight className="w-3 h-3" />
                        </span>
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
