'use client';

/**
 * ProductionOrdersModule
 *
 * Admin dashboard for managing production orders.
 * Displays orders in a data table with filtering, sorting, and action buttons.
 *
 * Requirements: 4.9, 4.10, 15.5
 */

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductionState, ProductionOrder } from '@/src/types/production';
import { getValidNextStates } from '@/src/lib/production/state-machine';
import { ProductionOrderDetailModal } from '@/src/components/admin/modals/ProductionOrderDetailModal';

// =============================================
// TYPES
// =============================================

type StateFilter = 'all' | ProductionState;
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

interface FilterState {
  state: StateFilter;
  priority: PriorityFilter;
  searchTerm: string;
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

function priorityLabel(priority: number): string {
  if (priority >= 75) return 'High';
  if (priority >= 50) return 'Medium';
  return 'Low';
}

function priorityValue(label: PriorityFilter): number | null {
  if (label === 'high') return 75;
  if (label === 'medium') return 50;
  if (label === 'low') return 0;
  return null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =============================================
// FETCH FUNCTION
// =============================================

async function fetchProductionOrders(
  state?: ProductionState,
  limit = 100,
  offset = 0
): Promise<{ orders: ProductionOrder[]; total: number }> {
  const params = new URLSearchParams();
  if (state) params.append('state', state);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const res = await fetch(`/api/production-orders?${params}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error('Failed to fetch production orders');
  const data = await res.json();
  return {
    orders: data.production_orders ?? [],
    total: data.pagination?.total ?? 0,
  };
}

// =============================================
// COMPONENT
// =============================================

export function ProductionOrdersModule() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterState>({
    state: 'all',
    priority: 'all',
    searchTerm: '',
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Fetch orders
  const { data, isLoading, error } = useQuery({
    queryKey: ['production-orders', filters.state, page],
    queryFn: () =>
      fetchProductionOrders(
        filters.state === 'all' ? undefined : (filters.state as ProductionState),
        pageSize,
        page * pageSize
      ),
  });

  // Filter orders by priority and search
  const filteredOrders = React.useMemo(() => {
    if (!data?.orders) return [];

    return data.orders.filter((order) => {
      // Priority filter
      if (filters.priority !== 'all') {
        const minPriority = priorityValue(filters.priority) ?? 0;
        if (filters.priority === 'high' && order.priority < 75) return false;
        if (filters.priority === 'medium' && (order.priority < 50 || order.priority >= 75)) return false;
        if (filters.priority === 'low' && order.priority >= 50) return false;
      }

      // Search filter
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          order.id.toLowerCase().includes(term) ||
          order.order_id.toLowerCase().includes(term) ||
          order.order_item_id.toLowerCase().includes(term)
        );
      }

      return true;
    });
  }, [data?.orders, filters.priority, filters.searchTerm]);

  const handleStateFilterChange = useCallback((state: StateFilter) => {
    setFilters((prev) => ({ ...prev, state }));
    setPage(0);
  }, []);

  const handlePriorityFilterChange = useCallback((priority: PriorityFilter) => {
    setFilters((prev) => ({ ...prev, priority }));
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['production-orders'] });
  }, [queryClient]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', fontWeight: 600 }}>
          Production Orders
        </h2>

        {/* Filters */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '15px',
          }}
        >
          {/* State Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
              State
            </label>
            <select
              value={filters.state}
              onChange={(e) => handleStateFilterChange(e.target.value as StateFilter)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="all">All States</option>
              {Object.values(ProductionState).map((state) => (
                <option key={state} value={state}>
                  {state.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handlePriorityFilterChange(e.target.value as PriorityFilter)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="all">All Priorities</option>
              <option value="high">High (75+)</option>
              <option value="medium">Medium (50-74)</option>
              <option value="low">Low (0-49)</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Order ID, Item ID..."
              value={filters.searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Refresh Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={handleRefresh}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Loading...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
          Error loading orders
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          No orders found
        </div>
      ) : (
        <>
          <div
            style={{
              overflowX: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Order ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Product Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>State</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Priority</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Retries</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Created</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td style={{ padding: '12px' }}>
                      <code style={{ fontSize: '12px', color: '#6366f1' }}>
                        {order.id.slice(0, 8)}...
                      </code>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor: order.product_type === 'predesigned' ? '#dbeafe' : '#fce7f3',
                          color: order.product_type === 'predesigned' ? '#1e40af' : '#be185d',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {order.product_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor: stateColor(order.current_state) + '20',
                          color: stateColor(order.current_state),
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {order.current_state.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor:
                            order.priority >= 75
                              ? '#fee2e2'
                              : order.priority >= 50
                                ? '#fef3c7'
                                : '#dbeafe',
                          color:
                            order.priority >= 75
                              ? '#991b1b'
                              : order.priority >= 50
                                ? '#92400e'
                                : '#1e40af',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {priorityLabel(order.priority)}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {order.retry_count}/{order.max_retries}
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>
                      {formatDate(order.created_at)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => setSelectedOrderId(order.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '15px',
              fontSize: '14px',
              color: '#6b7280',
            }}
          >
            <span>
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, data?.total ?? 0)} of{' '}
              {data?.total ?? 0}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  padding: '6px 12px',
                  backgroundColor: page === 0 ? '#e5e7eb' : '#3b82f6',
                  color: page === 0 ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * pageSize >= (data?.total ?? 0)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: (page + 1) * pageSize >= (data?.total ?? 0) ? '#e5e7eb' : '#3b82f6',
                  color: (page + 1) * pageSize >= (data?.total ?? 0) ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (page + 1) * pageSize >= (data?.total ?? 0) ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedOrderId && (
        <ProductionOrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
