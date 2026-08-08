/**
 * Admin Order Detail API
 *
 * GET /api/admin/orders/[id] — single order with its items (including custom
 * design data, variant/model/product-type names) for the admin detail view.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        variant:variants(
          id, name, color_name, color_hex,
          image_url, mask_image_url,
          model:models(id, name, mockup_template_url, brand:brands(id, name)),
          product_type:product_types(id, name)
        ),
        design:designs(id, name, image_url, thumbnail_url),
        model:models(id, name, brand:brands(id, name)),
        product_type:product_types(id, name, base_price)
      `)
      .eq('order_id', id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 });
    }

    return NextResponse.json({
      order,
      order_items: orderItems ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
