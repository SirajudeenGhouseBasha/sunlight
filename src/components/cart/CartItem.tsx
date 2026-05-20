'use client';

/**
 * CartItem Component
 *
 * Renders a single cart item, handling both predesigned and custom products
 * with correct display, pricing, and remove action.
 *
 * Requirements: 1.5, 6.1, 6.2
 */

import React from 'react';
import { Trash2 } from 'lucide-react';

// =============================================
// TYPES
// =============================================

interface CartItemVariant {
  id: string;
  name: string;
  color_name: string;
  color_hex?: string | null;
  image_url?: string | null;
  model?: { name: string; brand?: { name: string } };
  product_type?: { name: string };
}

interface CartItemDesign {
  id: string;
  name: string;
  image_url: string;
  thumbnail_url?: string | null;
}

export interface CartItemData {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  // Predesigned
  design_id?: string | null;
  design?: CartItemDesign | null;
  variant_id?: string | null;
  variant?: CartItemVariant | null;
  // Custom
  custom_design_data?: Record<string, unknown> | null;
  model_id?: string | null;
  product_type_id?: string | null;
}

interface Props {
  item: CartItemData;
  onRemove?: (itemId: string) => void;
  onQuantityChange?: (itemId: string, quantity: number) => void;
  isRemoving?: boolean;
}

// =============================================
// HELPERS
// =============================================

function isPredesigned(item: CartItemData): boolean {
  return item.design_id != null;
}

// =============================================
// COMPONENT
// =============================================

export function CartItem({ item, onRemove, onQuantityChange, isRemoving }: Props) {
  const predesigned = isPredesigned(item);

  const imageUrl = predesigned
    ? (item.design?.thumbnail_url ?? item.design?.image_url ?? item.variant?.image_url ?? null)
    : null;

  const title = predesigned
    ? (item.design?.name ?? 'Predesigned Case')
    : 'Custom Design';

  const subtitle = predesigned
    ? [
        item.variant?.model?.brand?.name,
        item.variant?.model?.name,
        item.variant?.color_name,
        item.variant?.product_type?.name,
      ].filter(Boolean).join(' · ')
    : [
        item.variant?.model?.name ?? 'Custom Case',
        item.variant?.product_type?.name,
      ].filter(Boolean).join(' · ');

  return (
    <div style={{
      display: 'flex', gap: 16, padding: '16px 0',
      borderBottom: '1px solid #f3f4f6',
      opacity: isRemoving ? 0.5 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Image / placeholder */}
      <div style={{
        width: 80, height: 80, flexShrink: 0,
        borderRadius: 8, overflow: 'hidden',
        background: '#f9fafb', border: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {imageUrl ? (
          <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 28, opacity: 0.4 }}>{predesigned ? '🖼️' : '✏️'}</span>
        )}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            {/* Type badge */}
            <span style={{
              display: 'inline-block', marginBottom: 4,
              fontSize: 10, fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase',
              padding: '2px 7px', borderRadius: 20,
              background: predesigned ? '#dbeafe' : '#f3e8ff',
              color: predesigned ? '#1d4ed8' : '#7c3aed',
            }}>
              {predesigned ? 'Predesigned' : 'Custom'}
            </span>

            <div style={{ fontSize: 14, fontWeight: 600, color: '#111', lineHeight: 1.3 }}>
              {title}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {subtitle}
            </div>
          </div>

          {/* Remove button */}
          {onRemove && (
            <button
              onClick={() => onRemove(item.id)}
              disabled={isRemoving}
              aria-label="Remove item"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9ca3af', padding: 4, flexShrink: 0,
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Quantity + price row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          {/* Quantity control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onQuantityChange ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                <button
                  onClick={() => item.quantity > 1 && onQuantityChange(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1 || isRemoving}
                  style={{ padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#374151' }}
                >−</button>
                <span style={{ padding: '4px 8px', fontSize: 13, fontWeight: 600, minWidth: 28, textAlign: 'center' }}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  disabled={isRemoving}
                  style={{ padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#374151' }}
                >+</button>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: '#6b7280' }}>Qty: {item.quantity}</span>
            )}
          </div>

          {/* Price */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
              ${Number(item.total_price).toFixed(2)}
            </div>
            {item.quantity > 1 && (
              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                ${Number(item.unit_price).toFixed(2)} each
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
