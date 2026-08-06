import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let baseQuery = supabase
      .from('orders')
      .select('*', { count: 'exact', head: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) baseQuery = baseQuery.eq('status', status);
    if (paymentStatus) baseQuery = baseQuery.eq('payment_status', paymentStatus);
    if (search) {
      baseQuery = baseQuery.or(
        `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,upi_transaction_id.ilike.%${search}%`
      );
    }

    const { data: orders, error, count } = await baseQuery;

    if (error) {
      console.error('Admin orders fetch error:', error);
      return NextResponse.json({ error: `Failed to fetch orders: ${error.message}` }, { status: 500 });
    }

    const userIds = [...new Set((orders ?? []).map((o: any) => o.user_id).filter(Boolean))];
    const userMap: Record<string, { full_name: string | null; email: string | null; phone: string | null }> = {};

    if (userIds.length > 0) {
      const { data: userRows } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .in('id', userIds);
      if (userRows) {
        for (const u of userRows) {
          userMap[u.id] = { full_name: u.full_name, email: u.email, phone: u.phone };
        }
      }
    }

    const ordersWithUser = (orders ?? []).map((o: any) => ({
      ...o,
      user: userMap[o.user_id] ?? null,
    }));

    return NextResponse.json({
      orders: ordersWithUser,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (e) {
    console.error('Admin orders API error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, action, tracking_number } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Action 1: Verify payment → mark as PAID
    if (action === 'verify-payment') {
      updateData.status = 'PAID';
      updateData.verified_at = new Date().toISOString();
      updateData.verified_by = user.id;
    }

    // Action 2: Add tracking number → mark as SHIPPED
    if (action === 'add-tracking') {
      updateData.status = 'SHIPPED';
      updateData.tracking_number = tracking_number ?? null;
      updateData.shipped_at = new Date().toISOString();
    }

    // Action 3: Mark as delivered
    if (action === 'mark-delivered') {
      updateData.status = 'DELIVERED';
      updateData.delivered_at = new Date().toISOString();
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
