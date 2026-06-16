/**
 * Orders API Route
 *
 * GET  /api/orders  — list user's orders
 * POST /api/orders  — create order from cart (uses OrderCreator service)
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { OrderCreator } from '@/src/lib/orders/order-creator';

// =============================================
// GET /api/orders
// =============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data: orders, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({
      orders: orders ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================
// POST /api/orders
// =============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      shipping_address,
      billing_address,
      notes,
      customer_name,
      customer_phone,
      customer_email,
      payment_method,
      upi_transaction_id,
      payment_screenshot_url,
      delivery_location,
    } = body;

    if (!shipping_address) {
      return NextResponse.json(
        { error: 'shipping_address is required' },
        { status: 400 }
      );
    }

    if (!customer_name || !customer_phone) {
      return NextResponse.json(
        { error: 'customer_name and customer_phone are required' },
        { status: 400 }
      );
    }

    if (payment_method === 'upi' && !upi_transaction_id) {
      return NextResponse.json(
        { error: 'upi_transaction_id is required when paying via UPI' },
        { status: 400 }
      );
    }

    const creator = new OrderCreator(supabase);

    const result = await creator.createOrderFromCart(
      user.id,
      {
        shipping_address,
        billing_address: billing_address ?? shipping_address,
        notes: notes ?? undefined,
        payment_method: payment_method ?? undefined,
        upi_transaction_id: upi_transaction_id ?? undefined,
        payment_screenshot_url: payment_screenshot_url ?? undefined,
        customer_name,
        customer_phone,
        customer_email: customer_email ?? undefined,
        delivery_location: delivery_location ?? undefined,
      }
    );

    if (!result.success) {
      const isStockError = result.error?.toLowerCase().includes('insufficient stock');
      return NextResponse.json(
        { error: result.error },
        { status: isStockError ? 409 : 422 }
      );
    }

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', result.order_id!)
      .single();

    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
