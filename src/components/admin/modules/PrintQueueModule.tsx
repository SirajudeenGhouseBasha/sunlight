'use client';

/**
 * PrintQueueModule
 *
 * Admin dashboard for managing the print queue.
 * Displays queued print jobs ordered by priority and creation time.
 *
 * Requirements: 5.1, 5.6
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductionOrder } from '@/src/types/production';

// =============================================
// TYPES
// =============================================

interface PrintQueueResponse {
  print_queue: ProductionOrder[];
  count: number;
}

interface ProcessQueueResponse {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ order_id: string; error: string }>;
}

// =============================================
// HELPERS
// =============================================

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function priorityLabel(priority: number): string {
  if (priority >= 75) return 'High';
  if (priority >= 50) return 'Medium';
  return 'Low';
}

// =============================================
// FETCH FUNCTIONS
// =============================================

async function fetchPrintQueue(limit = 50): Promise<PrintQueueResponse> {
  const res = await fetch(`/api/production/print-queue?limit=${limit}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error('Failed to fetch print queue');
  return res.json();
}

async function processPrintQueue(limit = 50): Promise<ProcessQueueResponse> {
  const res = await fetch('/api/production/print-queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ limit }),
  });

  if (!res.ok) throw new Error('Failed to process print queue');
  return res.json();
}

// =============================================
// COMPONENT
// =============================================

export function PrintQueueModule() {
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  // Fetch print queue
  const { data, isLoading, error } = useQuery({
    queryKey: ['print-queue'],
    queryFn: () => fetchPrintQueue(100),
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Process queue mutation
  const processMutation = useMutation({
    mutationFn: () => processPrintQueue(100),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-queue'] });
    },
  });

  const handleProcessQueue = useCallback(() => {
    processMutation.mutate();
  }, [processMutation]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['print-queue'] });
  }, [queryClient]);

  const handleToggleAutoRefresh = useCallback(() => {
    setAutoRefresh((prev) => !prev);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', fontWeight: 600 }}>
          Print Queue
        </h2>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '15px',
          }}
        >
          <button
            onClick={handleProcessQueue}
            disabled={processMutation.isPending || (data?.print_queue?.length ?? 0) === 0}
            style={{
              padding: '10px 16px',
              backgroundColor: processMutation.isPending ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: processMutation.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {processMutation.isPending ? 'Processing...' : 'Process Queue'}
          </button>

          <button
            onClick={handleRefresh}
            style={{
              padding: '10px 16px',
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

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={handleToggleAutoRefresh}
              style={{ cursor: 'pointer' }}
            />
            Auto-refresh ({refreshInterval / 1000}s)
          </label>

          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value, 10))}
            style={{
              padding: '10px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value={2000}>2 seconds</option>
            <option value={5000}>5 seconds</option>
            <option value={10000}>10 seconds</option>
            <option value={30000}>30 seconds</option>
          </select>
        </div>

        {/* Status */}
        {processMutation.isSuccess && processMutation.data && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#d1fae5',
              color: '#065f46',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '15px',
            }}
          >
            ✓ Processed {processMutation.data.processed} items: {processMutation.data.succeeded} succeeded,{' '}
            {processMutation.data.failed} failed
          </div>
        )}

        {processMutation.isError && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '15px',
            }}
          >
            ✗ Error processing queue
          </div>
        )}
      </div>

      {/* Queue Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>
            {data?.count ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Items in Queue
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
          Error loading print queue
        </div>
      ) : (data?.print_queue?.length ?? 0) === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Print queue is empty
        </div>
      ) : (
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
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Priority</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Retries</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Created</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Print File</th>
              </tr>
            </thead>
            <tbody>
              {data?.print_queue?.map((order) => (
                <tr
                  key={order.id}
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                  }}
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
                    {order.print_file_url ? (
                      <a
                        href={order.print_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#3b82f6',
                          textDecoration: 'none',
                          fontSize: '12px',
                        }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
