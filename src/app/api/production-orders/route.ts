/**
 * Production Orders API Route
 *
 * GET  /api/production-orders  — list production orders (admin, filterable by state)
 * POST /api/production-orders  — create a production order manually (admin only)
 *
 * Requirements: 4.1, 4.10, 15.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { validateAdminAccess } from '@/src/lib/auth/api-auth';
import { ProductionOrderManager } from '@/src/lib/production/production-order-manager';
import { ProductionState, ProductType } from '@/src/types/production';

// =============================================
// GET /api/production-orders
// =============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await validateAdminAccess();
    if (!auth.isValid) return auth.response;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const state = searchParams.get('state') as ProductionState | null;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // Validate state filter when provided
    if (state && !Object.values(ProductionState).includes(state)) {
      return NextResponse.json(
        { error: `Invalid state "${state}". Must be one of: ${Object.values(ProductionState).join(', ')}.` },
        { status: 400 }
      );
    }

    let query = supabase
      .from('production_orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (state) {
      query = query.eq('current_state', state);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('GET /api/production-orders error:', error);
      return NextResponse.json({ error: 'Failed to fetch production orders.' }, { status: 500 });
    }

    return NextResponse.json({
      production_orders: data,
      pagination: {
        limit,
        offset,
        total: count ?? 0,
      },
    });
  } catch (err) {
    console.error('GET /api/production-orders unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// =============================================
// POST /api/production-orders
// =============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await validateAdminAccess();
    if (!auth.isValid) return auth.response;

    const supabase = await createClient();
    const body = await request.json();

    const {
      order_id,
      order_item_id,
      variant_id,
      product_type,
      design_id,
      customization_data,
      print_file_url,
      priority,
      max_retries,
    } = body;

    // Required field validation
    if (!order_id || !order_item_id || !variant_id || !product_type) {
      return NextResponse.json(
        { error: 'order_id, order_item_id, variant_id, and product_type are required.' },
        { status: 400 }
      );
    }

    if (!Object.values(ProductType).includes(product_type)) {
      return NextResponse.json(
        { error: `Invalid product_type "${product_type}". Must be "predesigned" or "custom".` },
        { status: 400 }
      );
    }

    const manager = new ProductionOrderManager(supabase);
    const result = await manager.createProductionOrder({
      order_id,
      order_item_id,
      variant_id,
      product_type,
      design_id: design_id ?? null,
      customization_data: customization_data ?? null,
      print_file_url: print_file_url ?? null,
      priority: priority ?? 50,
      max_retries: max_retries ?? 3,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json({ production_order: result.data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/production-orders unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}