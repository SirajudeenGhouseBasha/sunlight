'use client';

/**
 * PredesignedProductGallery
 *
 * Displays predesigned products with variant-specific images, colour
 * selection, pricing, and "Add to Cart" functionality.
 *
 * Requirements: 2.6, 2.7, 12.1, 12.2, 12.4
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toProxiedUrl } from '@/src/utils/image-url';

// =============================================
// TYPES
// =============================================

interface PredesignedProduct {
  id: string;
  name: string;
  description: string | null;
  price_override: number | null;
  final_price: number;
  is_featured: boolean;
  display_order: number;
  color_name: string | null;
  color_hex: string | null;
  design_image_url: string | null;
  variant_image_url: string | null;
  additional_image_urls: string[];
  brand: { id: string; name: string } | null;
  model: { id: string; name: string } | null;
  product_type: { id: string; name: string; base_price: number } | null;
}

interface Props {
  /** When true, only show is_featured products */
  featuredOnly?: boolean;
  /** Max items to display */
  limit?: number;
  /** Show "View All" link at the bottom */
  showViewAll?: boolean;
}

// =============================================
// API
// =============================================

async function fetchPredesigned(featuredOnly: boolean, limit: number): Promise<PredesignedProduct[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (featuredOnly) params.set('featured', 'true');
  const res = await fetch(`/api/predesigned?${params}`);
  if (!res.ok) throw new Error('Failed to fetch predesigned products');
  const data = await res.json();
  return data.products ?? data.predesigned_products ?? [];
}

async function addToCart(productId: string): Promise<void> {
  const res = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ predesigned_product_id: productId, quantity: 1 }),
  });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.error ?? 'Failed to add to cart');
  }
}

// =============================================
// HELPERS
// =============================================

function calcPrice(product: PredesignedProduct): number {
  return product.final_price ?? product.price_override ?? product.product_type?.base_price ?? 0;
}

// =============================================
// PRODUCT CARD
// =============================================

function ProductCard({ product }: { product: PredesignedProduct }) {
  const queryClient = useQueryClient();
  const [added, setAdded] = useState(false);

  const price = calcPrice(product);
  const imageUrl = toProxiedUrl(product.design_image_url ?? product.variant_image_url ?? null);

  const mutation = useMutation({
    mutationFn: () => addToCart(product.id),
    onSuccess: () => {
      setAdded(true);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setTimeout(() => setAdded(false), 2000);
    },
  });

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Image */}
      <div style={{
        height: 220, background: '#f9fafb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ fontSize: 48, opacity: 0.3 }}>📱</div>
        )}
        {product.is_featured && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: '#000', color: '#fff',
            fontSize: 10, fontWeight: 700, letterSpacing: 1,
            padding: '3px 8px', borderRadius: 20,
          }}>FEATURED</span>
        )}
        {/* Color swatch */}
        {product.color_hex && (
          <span style={{
            position: 'absolute', bottom: 10, right: 10,
            width: 18, height: 18, borderRadius: '50%',
            background: product.color_hex,
            border: '2px solid #fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            display: 'inline-block',
          }} title={product.color_name ?? ''} />
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px 16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
            {[product.brand?.name, product.model?.name, product.product_type?.name].filter(Boolean).join(' · ')}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111', lineHeight: 1.3 }}>
            {product.name}
          </div>
          {product.description && (
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 1.5 }}>
              {product.description}
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>
            ₹{price.toFixed(2)}
          </span>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            style={{
              padding: '8px 16px', borderRadius: 8,
              background: added ? '#10b981' : '#000',
              color: '#fff', fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              transition: 'background 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {mutation.isPending ? 'Adding…' : added ? '✓ Added' : 'Add to Cart'}
          </button>
        </div>

        {mutation.isError && (
          <div style={{ fontSize: 11, color: '#ef4444' }}>
            {mutation.error?.message ?? 'Failed to add to cart'}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// MAIN COMPONENT
// =============================================

export function PredesignedProductGallery({ featuredOnly = false, limit = 20, showViewAll = true }: Props) {
  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['predesigned-products', featuredOnly, limit],
    queryFn: () => fetchPredesigned(featuredOnly, limit),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            height: 360, borderRadius: 12, background: '#f3f4f6',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#ef4444', fontSize: 14 }}>
        Failed to load products. Please try again.
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📱</div>
        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
          {featuredOnly
            ? 'No featured designs available right now.'
            : 'No predesigned products available yet.'}
        </p>
        {showViewAll && (
          <Link href="/predesigned" style={{
            display: 'inline-block',
            padding: '10px 28px', borderRadius: 8,
            border: '2px solid #000', color: '#000',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
            transition: 'all 0.2s',
          }}>
            Browse All Designs →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @media (max-width: 640px) {
          .gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
      <div className="gallery-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 20,
      }}>
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {showViewAll && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/predesigned" style={{
            display: 'inline-block',
            padding: '10px 28px', borderRadius: 8,
            border: '2px solid #000', color: '#000',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
            transition: 'all 0.2s',
          }}>
            Shop All Designs →
          </Link>
        </div>
      )}
    </div>
  );
}
