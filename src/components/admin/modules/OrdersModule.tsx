'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Pagination } from '@/src/components/admin/shared/Pagination';
import { SearchBar } from '@/src/components/admin/shared/SearchBar';
import { useToast } from '@/src/components/admin/shared/Toast';
import { useDataTable } from '@/src/hooks/useDataTable';
import { ProductionDataTable, Column } from '@/src/components/ui/productionDataTable';
import { Download } from 'lucide-react';
import { toProxiedUrl } from '@/src/utils/image-url';

export interface AdminOrder {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  total_amount: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address: Record<string, string>;
  payment_method?: string;
  upi_transaction_id?: string;
  payment_screenshot_url?: string;
  verified_at?: string;
  notes?: string;
  tracking_number?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  users?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

interface OrderDetailProps {
  order: AdminOrder;
  items: AdminOrderItem[];
  itemsLoading: boolean;
  onClose: () => void;
  onVerify: (id: string) => Promise<void>;
  onShip: (id: string, trackingNumber: string) => Promise<void>;
  onDeliver: (id: string) => Promise<void>;
  verifying: boolean;
  shipping: boolean;
  delivering: boolean;
}

interface DesignElement {
  type: 'image' | 'text';
  id?: string;
  src?: string;
  content?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  contrast?: number;
  brightness?: number;
  saturate?: number;
  flipX?: boolean;
}

export interface AdminOrderItem {
  id: string;
  variant_id?: string | null;
  design_id?: string | null;
  model_id?: string | null;
  product_type_id?: string | null;
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  custom_design_data?: { elements?: DesignElement[] } | null;
  customization_options?: { elements?: DesignElement[] } | null;
  design?: {
    id: string;
    name: string;
    image_url?: string | null;
    thumbnail_url?: string | null;
  } | null;
  variant?: {
    id: string;
    name: string;
    color_name?: string | null;
    image_url?: string | null;
    mask_image_url?: string | null;
    model?: {
      name: string;
      mockup_template_url?: string | null;
      brand?: { name: string } | null;
    } | null;
    product_type?: { name: string } | null;
  } | null;
  product_type?: { id: string; name: string; base_price?: string | number } | null;
}

const CANVAS_WIDTH = 340;
const CANVAS_HEIGHT = 560;

function CustomDesignPreview({
  elements,
  caseImageUrl,
  maskImageUrl,
}: {
  elements: DesignElement[];
  caseImageUrl?: string | null;
  maskImageUrl?: string | null;
}) {
  const scale = 140 / CANVAS_WIDTH;
  const width = CANVAS_WIDTH * scale;
  const height = CANVAS_HEIGHT * scale;

  return (
    <div
      className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0"
      style={{ width, height }}
    >
      {caseImageUrl ? (
        <img
          src={caseImageUrl}
          alt="Case mockup"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-200 to-gray-300">
          <span className="text-4xl opacity-30">PH</span>
        </div>
      )}

      {elements.map((el, i) => {
        const pos = {
          left: el.x * scale,
          top: el.y * scale,
          width: el.width * scale,
          height: el.height * scale,
        };
        if (el.type === 'image' && el.src) {
          return (
            <img
              key={el.id ?? i}
              src={el.src}
              alt={`Element ${i + 1}`}
              className="absolute object-contain z-10"
              style={{
                ...pos,
                filter: `contrast(${el.contrast ?? 100}%) brightness(${el.brightness ?? 100}%) saturate(${el.saturate ?? 100}%)`,
                transform: el.flipX ? 'scaleX(-1)' : undefined,
              }}
            />
          );
        }
        return (
          <div
            key={el.id ?? i}
            className="absolute flex items-center justify-center overflow-hidden z-10"
            style={{
              ...pos,
              fontSize: (el.fontSize ?? 20) * scale,
              color: el.color ?? '#ffffff',
              fontFamily: el.fontFamily ?? 'Inter, sans-serif',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}
          >
            {el.content}
          </div>
        );
      })}

      {(maskImageUrl || caseImageUrl) && (
        <img
          src={maskImageUrl || caseImageUrl || ''}
          alt="Case overlay mask"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-30"
          style={{ mixBlendMode: maskImageUrl ? 'normal' : 'multiply' }}
          draggable={false}
        />
      )}
    </div>
  );
}

function CustomDesignDetails({
  elements,
  caseImageUrl,
  maskImageUrl,
}: {
  elements: DesignElement[];
  caseImageUrl?: string | null;
  maskImageUrl?: string | null;
}) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200 flex gap-4">
      <CustomDesignPreview
        elements={elements}
        caseImageUrl={caseImageUrl}
        maskImageUrl={maskImageUrl}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700 mb-1.5">
          Design Elements ({elements.length})
        </p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {elements.map((el, i) => (
            <div key={el.id ?? i} className="bg-white rounded-md border border-gray-200 px-2.5 py-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gray-800 truncate">
                  {el.type === 'text' ? `Text: ${el.content ?? ''}` : `Image ${i + 1}`}
                </span>
                {el.type === 'image' && el.src && (
                  <a
                    href={el.src}
                    download={`element-${i + 1}.png`}
                    className="text-green-600 hover:text-green-700 font-medium flex items-center gap-0.5 flex-shrink-0"
                  >
                    <Download className="w-3 h-3" /> Download
                  </a>
                )}
              </div>
              <p className="text-gray-500 mt-0.5 break-words">
                X {Math.round(el.x)} · Y {Math.round(el.y)} · W {Math.round(el.width)} · H{' '}
                {Math.round(el.height)}
                {el.type === 'text' && el.fontSize ? ` · ${Math.round(el.fontSize)}px` : ''}
                {el.type === 'text' && el.color ? ` · ${el.color}` : ''}
                {el.type === 'text' && el.fontFamily ? ` · ${el.fontFamily.split(',')[0]}` : ''}
                {el.type === 'image'
                  ? ` · C ${el.contrast ?? 100}% · B ${el.brightness ?? 100}% · S ${el.saturate ?? 100}%${el.flipX ? ' · flipped' : ''}`
                  : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, items, itemsLoading, onClose, onVerify, onShip, onDeliver, verifying, shipping, delivering }: OrderDetailProps) {
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');

  const statusDisplay = (status: string) => {
    const labels: Record<string, string> = {
      PENDING_PAYMENT: 'Pending Payment Verification',
      PAID: 'Paid / Confirmed',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
    };
    return labels[status] || status;
  };

  const statusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-green-100 text-green-800',
      DELIVERED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Order #{order.order_number}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          {/* Status */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-sm mb-1">Status</p>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${statusBadgeColor(order.status)}`}>
              {statusDisplay(order.status)}
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Customer</h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
              <p><span className="text-gray-500">Name:</span> {order.customer_name || order.users?.full_name || '-'}</p>
              <p><span className="text-gray-500">Phone:</span> {order.customer_phone || order.users?.phone || '-'}</p>
              <p><span className="text-gray-500">Email:</span> {order.customer_email || order.users?.email || '-'}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <p>{order.shipping_address?.street}</p>
              <p>{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}</p>
              <p>{order.shipping_address?.country}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
              <p><span className="text-gray-500">Method:</span> {order.payment_method || 'N/A'}</p>
              {order.upi_transaction_id && (
                <p><span className="text-gray-500">UPI Transaction ID:</span> <span className="font-mono">{order.upi_transaction_id}</span></p>
              )}
              <p><span className="text-gray-500">Amount:</span> <strong>₹{parseFloat(order.total_amount.toString()).toFixed(2)}</strong></p>
              {order.payment_screenshot_url && (
                <div>
                  <p className="text-gray-500 mb-2">Screenshot:</p>
                  <a href={order.payment_screenshot_url} target="_blank" rel="noopener noreferrer">
                    <img src={order.payment_screenshot_url} alt="Payment Screenshot" className="max-w-xs rounded-lg border" />
                  </a>
                </div>
              )}
              {order.verified_at && (
                <p className="text-green-600"><span className="text-gray-500">Verified at:</span> {new Date(order.verified_at).toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
            {itemsLoading ? (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500">Loading items...</div>
            ) : items.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500">No items</div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const elements =
                    item.custom_design_data?.elements ?? item.customization_options?.elements ?? [];
                  const isCustom = elements.length > 0;
                  return (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900">
                            {item.product_name || 'Phone Case'}
                            {item.variant_name && item.variant_name !== 'Standard'
                              ? ` (${item.variant_name})`
                              : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.variant?.model?.brand?.name || item.variant?.model?.name
                              ? `${item.variant?.model?.brand?.name ?? ''} ${item.variant?.model?.name ?? ''}`.trim()
                              : item.variant?.name}
                            {item.product_type?.name ? ` · ${item.product_type.name}` : ''}
                            {item.design?.name ? ` · Design: ${item.design.name}` : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Qty {item.quantity} × ₹{parseFloat(String(item.unit_price)).toFixed(2)}
                          </p>
                        </div>
                        <span className="font-semibold text-sm text-gray-900 flex-shrink-0">
                          ₹{parseFloat(String(item.total_price ?? item.unit_price * item.quantity)).toFixed(2)}
                        </span>
                      </div>

                      {isCustom && (
                        <CustomDesignDetails
                          elements={elements}
                          caseImageUrl={toProxiedUrl(
                            item.variant?.model?.mockup_template_url || item.variant?.image_url
                          )}
                          maskImageUrl={toProxiedUrl(item.variant?.mask_image_url)}
                        />
                      )}

                      {!isCustom && item.design?.image_url && (
                        <img
                          src={item.design.image_url}
                          alt={item.design.name}
                          className="mt-2 max-h-32 rounded-lg border"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action 1: Verify Payment */}
          {order.status === 'PENDING_PAYMENT' && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => onVerify(order.id)}
                disabled={verifying}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
              >
                {verifying ? 'Processing...' : '✓ Verify Payment'}
              </button>
            </div>
          )}

          {/* Action 2: Add Tracking Number */}
          {order.status === 'PAID' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Courier Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. INDIA POST — EB123456789IN"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the tracking number provided by India Post, DTDC, or your courier service.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!trackingNumber.trim()) return;
                  onShip(order.id, trackingNumber.trim());
                }}
                disabled={shipping || !trackingNumber.trim()}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
              >
                {shipping ? 'Processing...' : '📦 Mark as Shipped'}
              </button>
            </div>
          )}

          {/* Tracking info for shipped orders */}
          {order.status === 'SHIPPED' && order.tracking_number && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">Tracking Number</p>
              <p className="text-sm text-blue-700 font-mono mt-1">{order.tracking_number}</p>
              {order.shipped_at && (
                <p className="text-xs text-blue-600 mt-1">Shipped on: {new Date(order.shipped_at).toLocaleDateString()}</p>
              )}
              <p className="text-xs text-blue-500 mt-2">
                Track your shipment on the courier&apos;s website using the tracking number above.
              </p>
            </div>
          )}

          {/* Action 3: Mark as Delivered */}
          {order.status === 'SHIPPED' && (
            <button
              onClick={() => onDeliver(order.id)}
              disabled={delivering}
              className="w-full px-4 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 font-medium text-sm"
            >
              {delivering ? 'Processing...' : '✓ Mark as Delivered'}
            </button>
          )}

          {/* Delivered info */}
          {order.status === 'DELIVERED' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">Delivered to Customer</p>
              {order.delivered_at && (
                <p className="text-xs text-gray-600 mt-1">Delivered on: {new Date(order.delivered_at).toLocaleString()}</p>
              )}
            </div>
          )}

          {order.notes && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function fetchAdminOrders(options: any) {
  const params = new URLSearchParams({
    page: options.page?.toString() || '1',
    limit: options.limit?.toString() || '10',
    search: options.search || '',
    ...(options.status && { status: options.status }),
  });

  const response = await fetch(`/api/admin/orders?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  const data = await response.json();

  return {
    items: data.orders || [],
    pagination: {
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 10,
      total: data.pagination?.total || 0,
      totalPages: data.pagination?.totalPages || 0,
    },
  };
}

export function OrdersModule() {
  const { showToast } = useToast();

  const table = useDataTable<AdminOrder>({
    fetchFn: fetchAdminOrders,
    pageSize: 10,
    debounceMs: 300,
    retryAttempts: 3,
    syncIntervalMs: 30000,
    enableOfflineCache: true,
  });

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [orderItems, setOrderItems] = useState<AdminOrderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [delivering, setDelivering] = useState(false);

  useEffect(() => {
    if (!selectedOrder) return;
    let cancelled = false;
    setItemsLoading(true);
    setOrderItems([]);

    fetch(`/api/admin/orders/${selectedOrder.id}`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch order items');
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setOrderItems(data.order_items || []);
      })
      .catch(() => {
        if (!cancelled) setOrderItems([]);
      })
      .finally(() => {
        if (!cancelled) setItemsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedOrder]);

  const handleVerify = useCallback(async (id: string) => {
    setVerifying(true);
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'verify-payment' }),
      });

      if (!response.ok) throw new Error('Failed to verify payment');

      showToast('Payment verified — order is now confirmed', 'success');
      setSelectedOrder(null);
      table.retry();
    } catch {
      showToast('Failed to verify payment', 'error');
    } finally {
      setVerifying(false);
    }
  }, [table, showToast]);

  const handleShip = useCallback(async (id: string, trackingNumber: string) => {
    setShipping(true);
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'add-tracking', tracking_number: trackingNumber }),
      });

      if (!response.ok) throw new Error('Failed to update tracking');

      showToast('Order marked as shipped with tracking number', 'success');
      setSelectedOrder(null);
      table.retry();
    } catch {
      showToast('Failed to update tracking', 'error');
    } finally {
      setShipping(false);
    }
  }, [table, showToast]);

  const handleDeliver = useCallback(async (id: string) => {
    setDelivering(true);
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'mark-delivered' }),
      });

      if (!response.ok) throw new Error('Failed to mark as delivered');

      showToast('Order marked as delivered', 'success');
      setSelectedOrder(null);
      table.retry();
    } catch {
      showToast('Failed to mark as delivered', 'error');
    } finally {
      setDelivering(false);
    }
  }, [table, showToast]);

  const statusDisplay = (status: string) => {
    const labels: Record<string, string> = {
      PENDING_PAYMENT: 'Pending Payment',
      PAID: 'Paid / Confirmed',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
    };
    return labels[status] || status;
  };

  const columns: Column<AdminOrder>[] = useMemo(() => [
    {
      key: 'order_number',
      label: 'Order',
      width: '160px',
      render: (value: string, order: AdminOrder) => (
        <div>
          <p className="font-medium text-gray-900">#{value}</p>
          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      key: 'customer_name',
      label: 'Customer',
      width: '200px',
      render: (_value: string, order: AdminOrder) => (
        <div>
          <p className="font-medium text-gray-900">{order.customer_name || order.users?.full_name || 'N/A'}</p>
          <p className="text-xs text-gray-500">{order.customer_phone || order.users?.phone || ''}</p>
        </div>
      ),
    },
    {
      key: 'total_amount',
      label: 'Amount',
      width: '100px',
      render: (value: number) => (
        <span className="font-semibold text-gray-900">₹{parseFloat(value.toString()).toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '180px',
      render: (value: string) => {
        const colors: Record<string, string> = {
          PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
          PAID: 'bg-blue-100 text-blue-800',
          SHIPPED: 'bg-green-100 text-green-800',
          DELIVERED: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${colors[value] || 'bg-gray-100 text-gray-800'}`}>
            {statusDisplay(value)}
          </span>
        );
      },
    },
    {
      key: 'upiw_transaction_id',
      label: 'UPI TXN ID',
      width: '160px',
      render: (value: string, order: AdminOrder) => (
        <span className="text-xs font-mono text-gray-600">{order.upi_transaction_id || '-'}</span>
      ),
    },
    {
      key: 'tracking_number',
      label: 'Tracking',
      width: '160px',
      render: (value: string) => (
        <span className="text-xs text-gray-600">{value || '-'}</span>
      ),
    },
  ], []);

  const emptyMessage = table.searchQuery
    ? 'No orders found matching your search'
    : 'No orders yet';

  const emptySubMessage = table.searchQuery
    ? 'Try a different search term'
    : 'Orders will appear here once customers place them';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <SearchBar
            value={table.searchQuery}
            onChange={table.handleSearch}
            placeholder="Search by order#, name, phone, or txn ID..."
            disabled={table.isLoading}
          />
        </div>
        <div className="flex gap-2">
          {['', 'PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED'].map((filter) => (
            <button
              key={filter}
              onClick={() => table.handleSearch(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                table.searchQuery === filter
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filter ? statusDisplay(filter) : 'All'}
            </button>
          ))}
        </div>
      </div>

      <ProductionDataTable
        columns={columns}
        data={table.items}
        isLoading={table.isLoading}
        isSearching={table.isSearching}
        isPerformingAction={table.isPerformingAction}
        error={table.error}
        isEmpty={table.items.length === 0 && !table.isLoading}
        emptyMessage={emptyMessage}
        emptySubMessage={emptySubMessage}
        onRetry={table.retry}
        onSort={table.handleSort}
        sortBy={table.sortBy}
        sortOrder={table.sortOrder}
                    onEdit={(order) => setSelectedOrder(order)}
        showSerialNumber={true}
        stickyHeader={true}
      />

      {table.items.length > 0 && (
        <Pagination
          currentPage={table.pagination.page}
          totalPages={table.pagination.totalPages}
          totalItems={table.pagination.total}
          pageSize={table.pagination.limit}
          onPageChange={table.changePage}
          onPageSizeChange={table.changePageSize}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          items={orderItems}
          itemsLoading={itemsLoading}
          onClose={() => setSelectedOrder(null)}
          onVerify={handleVerify}
          onShip={handleShip}
          onDeliver={handleDeliver}
          verifying={verifying}
          shipping={shipping}
          delivering={delivering}
        />
      )}
    </div>
  );
}