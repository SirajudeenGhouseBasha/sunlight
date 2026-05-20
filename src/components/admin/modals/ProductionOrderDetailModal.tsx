'use client';

/**
 * ProductionOrderDetailModal
 *
 * Full-detail modal for a single production order. Shows state history
 * timeline, error info, order/item details, and action buttons for
 * valid next state transitions.
 *
 * Requirements: 4.4, 10.5
 */

import React, { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductionState, StateTransition } from '@/src/types/production';
import { getValidNextStates } from '@/src/lib/production/state-machine';

// =============================================
// TYPES
// =============================================

interface ProductionOrderDetail {
  id: string;
  order_id: string;
  order_item_id: string;
  product_type: 'predesigned' | 'custom';
  current_state: ProductionState;
  priority: number;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  print_file_url: string | null;
  customization_data: Record<string, unknown> | null;
  state_history: StateTransition[];
  created_at: string;
  updated_at: string;
  shipped_at: string | null;
  order?: {
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    created_at: string;
  };
  order_item?: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_name: string;
    variant_name: string;
    design_name: string | null;
  };
  variant?: {
    id: string;
    name: string;
    color_name: string;
    color_hex: string | null;
    image_url: string | null;
    model?: { name: string };
    product_type?: { name: string };
  };
  design?: {
    id: string;
    name: string;
    image_url: string;
    thumbnail_url: string | null;
  } | null;
}

interface Props {
  orderId: string;
  onClose: () => void;
}

// =============================================
// HELPERS
// =============================================

function stateColor(state: ProductionState): string {
  const map: Partial<Record<ProductionState, string>> = {
    [ProductionState.ORDER_RECEIVED]: '#6366f1',
    [ProductionState.DESIGN_VALIDATED]: '#8b5cf6',
    [ProductionState.PRINT_QUEUE]: '#3b82f6',
    [ProductionState.PRINTING]: '#06b6d4',
    [ProductionState.PRINT_COMPLETED]: '#10b981',
    [ProductionState.PRINT_FAILED]: '#ef4444',
    [ProductionState.QUALITY_CHECK]: '#f59e0b',
    [ProductionState.QUALITY_PASSED]: '#10b981',
    [ProductionState.QUALITY_FAILED]: '#ef4444',
    [ProductionState.PACKAGING]: '#8b5cf6',
    [ProductionState.READY_TO_SHIP]: '#06b6d4',
    [ProductionState.SHIPPED]: '#10b981',
    [ProductionState.CANCELLED]: '#6b7280',
  };
  return map[state] ?? '#6b7280';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// =============================================
// API
// =============================================

async function fetchOrder(id: string): Promise<ProductionOrderDetail> {
  const res = await fetch(`/api/production-orders/${id}`);
  if (!res.ok) throw new Error('Failed to fetch production order');
  const data = await res.json();
  return data.production_order;
}

async function doTransition(orderId: string, toState: ProductionState): Promise<void> {
  const res = await fetch(`/api/production-orders/${orderId}/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to_state: toState }),
  });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.error ?? 'Transition failed');
  }
}

async function doRetry(orderId: string): Promise<void> {
  const res = await fetch(`/api/production-orders/${orderId}/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Manual retry by admin' }),
  });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.error ?? 'Retry failed');
  }
}

// =============================================
// COMPONENT
// =============================================

export function ProductionOrderDetailModal({ orderId, onClose }: Props) {
  const queryClient = useQueryClient();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['production-order-detail', orderId],
    queryFn: () => fetchOrder(orderId),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['production-order-detail', orderId] });
    queryClient.invalidateQueries({ queryKey: ['production-orders'] });
  }, [queryClient, orderId]);

  const transitionMutation = useMutation({
    mutationFn: (toState: ProductionState) => doTransition(orderId, toState),
    onSuccess: invalidate,
  });

  const retryMutation = useMutation({
    mutationFn: () => doRetry(orderId),
    onSuccess: invalidate,
  });

  const validNextStates = order ? getValidNextStates(order.current_state) : [];
  const mutationError = transitionMutation.error?.message ?? retryMutation.error?.message ?? null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#1e1e2e', border: '1px solid #313244',
        borderRadius: 14, width: '100%', maxWidth: 760,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#cdd6f4',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #313244',
          position: 'sticky', top: 0, background: '#1e1e2e', zIndex: 10,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Production Order Detail</h2>
            <code style={{ fontSize: 11, color: '#6c7086' }}>{orderId}</code>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#6c7086',
            fontSize: 20, cursor: 'pointer', lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#6c7086' }}>Loading…</div>
          )}
          {isError && (
            <div style={{ textAlign: 'center', padding: 60, color: '#f38ba8' }}>Failed to load order.</div>
          )}

          {order && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Error message */}
              {order.error_message && (
                <div style={{
                  padding: '12px 16px', background: '#45142033',
                  border: '1px solid #f3838444', borderRadius: 8, color: '#f38ba8', fontSize: 13,
                }}>
                  <strong>Error:</strong> {order.error_message}
                </div>
              )}

              {/* Mutation error */}
              {mutationError && (
                <div style={{
                  padding: '10px 14px', background: '#45142033',
                  border: '1px solid #f3838444', borderRadius: 6, color: '#f38ba8', fontSize: 13,
                }}>
                  {mutationError}
                </div>
              )}

              {/* Status row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Current State', value: (
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 4,
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' as const,
                      background: stateColor(order.current_state) + '22',
                      color: stateColor(order.current_state),
                      border: `1px solid ${stateColor(order.current_state)}44`,
                    }}>
                      {order.current_state.replace(/_/g, ' ')}
                    </span>
                  )},
                  { label: 'Product Type', value: (
                    <span style={{ color: order.product_type === 'custom' ? '#cba6f7' : '#89dceb', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' as const }}>
                      {order.product_type}
                    </span>
                  )},
                  { label: 'Priority', value: `${order.priority}/100` },
                  { label: 'Retries', value: `${order.retry_count}/${order.max_retries}` },
                  { label: 'Created', value: formatDate(order.created_at) },
                  { label: 'Updated', value: formatDate(order.updated_at) },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: '#181825', border: '1px solid #313244',
                    borderRadius: 8, padding: '12px 14px',
                  }}>
                    <div style={{ fontSize: 10, color: '#6c7086', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 13 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Order info */}
              {order.order && (
                <Section title="Order">
                  <Row label="Order #" value={order.order.order_number} />
                  <Row label="Status" value={order.order.status} />
                  <Row label="Total" value={`$${Number(order.order.total_amount).toFixed(2)}`} />
                  <Row label="Placed" value={formatDate(order.order.created_at)} />
                </Section>
              )}

              {/* Order item info */}
              {order.order_item && (
                <Section title="Order Item">
                  <Row label="Product" value={order.order_item.product_name} />
                  <Row label="Variant" value={order.order_item.variant_name} />
                  {order.order_item.design_name && <Row label="Design" value={order.order_item.design_name} />}
                  <Row label="Qty" value={String(order.order_item.quantity)} />
                  <Row label="Unit Price" value={`$${Number(order.order_item.unit_price).toFixed(2)}`} />
                </Section>
              )}

              {/* Design preview for predesigned */}
              {order.product_type === 'predesigned' && order.design && (
                <Section title="Design Preview">
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <img
                      src={order.design.thumbnail_url ?? order.design.image_url}
                      alt={order.design.name}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #313244' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{order.design.name}</div>
                      <div style={{ fontSize: 11, color: '#6c7086', marginTop: 4 }}>{order.design.id}</div>
                    </div>
                  </div>
                </Section>
              )}

              {/* Custom design data */}
              {order.product_type === 'custom' && order.customization_data && (
                <Section title="Custom Design Data">
                  <pre style={{
                    background: '#181825', border: '1px solid #313244',
                    borderRadius: 6, padding: 12, fontSize: 11,
                    color: '#a6e3a1', overflowX: 'auto', maxHeight: 200,
                    margin: 0,
                  }}>
                    {JSON.stringify(order.customization_data, null, 2)}
                  </pre>
                </Section>
              )}

              {/* Print file */}
              {order.print_file_url && (
                <Section title="Print File">
                  <a href={order.print_file_url} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#89b4fa', fontSize: 13, wordBreak: 'break-all' }}>
                    {order.print_file_url}
                  </a>
                </Section>
              )}

              {/* State history timeline */}
              <Section title={`State History (${order.state_history.length} transitions)`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {order.state_history.map((entry, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      {/* Timeline line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%', marginTop: 4,
                          background: stateColor(entry.to_state),
                          border: `2px solid ${stateColor(entry.to_state)}66`,
                          flexShrink: 0,
                        }} />
                        {i < order.state_history.length - 1 && (
                          <div style={{ width: 2, flex: 1, minHeight: 24, background: '#313244', margin: '2px 0' }} />
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ paddingBottom: 16, flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            color: stateColor(entry.to_state),
                          }}>
                            {entry.to_state.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: 11, color: '#6c7086' }}>
                            {formatDate(entry.transitioned_at)}
                          </span>
                        </div>
                        {entry.metadata?.reason && (
                          <div style={{ fontSize: 12, color: '#9399b2', marginTop: 2 }}>
                            {String(entry.metadata.reason)}
                          </div>
                        )}
                        {entry.metadata?.triggered_by && (
                          <div style={{ fontSize: 11, color: '#6c7086', marginTop: 1 }}>
                            by {String(entry.metadata.triggered_by)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Action buttons */}
              {validNextStates.length > 0 && (
                <Section title="Actions">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {/* Retry button for failed states */}
                    {(order.current_state === ProductionState.PRINT_FAILED ||
                      order.current_state === ProductionState.QUALITY_FAILED) &&
                      order.retry_count < order.max_retries && (
                      <button
                        onClick={() => retryMutation.mutate()}
                        disabled={retryMutation.isPending}
                        style={actionBtn('#a6e3a1')}
                      >
                        ↺ Retry
                      </button>
                    )}
                    {/* Transition buttons */}
                    {validNextStates.map(state => (
                      <button
                        key={state}
                        onClick={() => transitionMutation.mutate(state)}
                        disabled={transitionMutation.isPending}
                        style={actionBtn(stateColor(state))}
                      >
                        → {state.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </Section>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// HELPERS
// =============================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#181825', border: '1px solid #313244', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #313244',
        fontSize: 11, fontWeight: 700, color: '#6c7086',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        {title}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: '1px solid #31324422' }}>
      <span style={{ color: '#6c7086' }}>{label}</span>
      <span style={{ color: '#cdd6f4', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function actionBtn(color: string): React.CSSProperties {
  return {
    padding: '6px 14px', borderRadius: 6, border: `1px solid ${color}44`,
    background: color + '22', color, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  };
}
