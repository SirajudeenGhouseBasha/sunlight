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
import { createServiceClient } from '@/src/lib/supabase/service';
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
    const { data: { user } } = await supabase.auth.getUser();

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
      // Guest cart items — sent from client when user is not logged in
      guest_cart_items,
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

    // Guest orders must supply cart items in the request body
    if (!user && (!guest_cart_items || !Array.isArray(guest_cart_items) || guest_cart_items.length === 0)) {
      return NextResponse.json(
        { error: 'Cart is empty. Cannot create an order.' },
        { status: 400 }
      );
    }

    const creator = new OrderCreator(supabase);
    const orderOptions = {
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
    };

    let result;
    if (user) {
      // Authenticated: pull cart from DB as before
      result = await creator.createOrderFromCart(user.id, orderOptions);
    } else {
      // Guest: create an anonymous Supabase user so we get a real user_id
      // that satisfies the NOT NULL + FK constraint on orders.user_id
      const serviceSupabase = createServiceClient();

      const { data: anonData, error: anonError } = await serviceSupabase.auth.admin.createUser({
        email: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@sunlight.guest`,
        email_confirm: true,
        user_metadata: {
          is_guest: true,
          customer_name,
          customer_phone,
        },
      });

      if (anonError || !anonData?.user) {
        return NextResponse.json(
          { error: `Failed to initialise guest session: ${anonError?.message}` },
          { status: 500 }
        );
      }

      const guestUserId = anonData.user.id;
      const guestEmail = anonData.user.email!;

      // Also ensure a row exists in the public users table (required by FK)
      await serviceSupabase.from('users').upsert({
        id: guestUserId,
        email: guestEmail,
        full_name: customer_name,
        role: 'user',
        is_active: true,
      }, { onConflict: 'id' });

      const guestCreator = new OrderCreator(serviceSupabase);
      result = await guestCreator.createOrderFromGuestCart(
        guest_cart_items,
        orderOptions,
        guestUserId
      );
    }

    if (!result.success) {
      const isStockError = result.error?.toLowerCase().includes('insufficient stock');
      return NextResponse.json(
        { error: result.error },
        { status: isStockError ? 409 : 422 }
      );
    }

    // Fetch the created order — use service client for guests so RLS doesn't block the read
    const fetchClient = user ? supabase : createServiceClient();
    const { data: order } = await fetchClient
      .from('orders')
      .select('*')
      .eq('id', result.order_id!)
      .single();

    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
