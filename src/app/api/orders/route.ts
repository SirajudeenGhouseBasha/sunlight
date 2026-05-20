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
    const { shipping_address, billing_address, notes } = body;

    if (!shipping_address || !billing_address) {
      return NextResponse.json(
        { error: 'shipping_address and billing_address are required' },
        { status: 400 }
      );
    }

    // Find the user's cart — cart_items are keyed by user_id directly
    // OrderCreator.createOrderFromCart expects a cart_id; we use user_id as the cart identifier
    // since cart_items.user_id is the cart key in this schema.
    const creator = new OrderCreator(supabase);

    // Validate stock before creating order
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id);

    if (cartError) {
      return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 });
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Use OrderCreator service — pass user_id as cartId since schema uses user_id
    const result = await creator.createOrderFromCart(
      user.id, // cartId (cart_items.user_id)
      user.id,
      {
        shipping_address_id: typeof shipping_address === 'string'
          ? shipping_address
          : JSON.stringify(shipping_address),
        notes: notes ?? undefined,
      }
    );

    if (!result.success) {
      // Distinguish stock errors (409) from other failures (422)
      const isStockError = result.error?.toLowerCase().includes('insufficient stock');
      return NextResponse.json(
        { error: result.error },
        { status: isStockError ? 409 : 422 }
      );
    }

    // Fetch the created order to return full details
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
