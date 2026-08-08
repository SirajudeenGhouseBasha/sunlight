/**
 * Individual Order API Route
 * 
 * Handles operations on individual orders
 * Requirements: 6.4, 13.1, 13.2 - Order details and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { sendOrderStatusEmail } from '@/src/lib/email/service';

// GET /api/orders/[id] - Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;

    // Check if admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin';

    // Fetch order with items
    let query = supabase
      .from('orders')
      .select('*')
      .eq('id', id);

    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data: order, error: orderError } = await query.single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        variant:variants(
          *,
          model:models(id, name, slug, brand:brands(id, name, slug)),
          product_type:product_types(id, name, slug)
        ),
        design:designs(id, name, image_url, thumbnail_url)
      `)
      .eq('order_id', id);
    
    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch order items' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      order: {
        ...order,
        items: items || [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update order (admin only for status updates)
// Owner actions:
//   1. Verify payment  → status: 'PAID'
//   2. Add tracking    → status: 'SHIPPED' + tracking_number
//   3. Mark delivered  → status: 'DELIVERED'
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    const { status, tracking_number, notes } = body;
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (status === 'PAID') {
      updateData.status = 'PAID';
      updateData.verified_at = new Date().toISOString();
      updateData.verified_by = user.id;
    }
    
    if (status === 'SHIPPED') {
      updateData.status = 'SHIPPED';
      updateData.shipped_at = new Date().toISOString();
    }
    
    if (status === 'DELIVERED') {
      updateData.status = 'DELIVERED';
      updateData.delivered_at = new Date().toISOString();
    }
    
    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number;
    }
    
    if (notes !== undefined) updateData.notes = notes;
    
    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    const emailKind =
      status === 'PAID'
        ? 'PAYMENT_VERIFIED'
        : status === 'SHIPPED'
          ? 'SHIPPED'
          : status === 'DELIVERED'
            ? 'DELIVERED'
            : null;

    if (emailKind && order) {
      await sendOrderStatusEmail(emailKind, {
        to: order.customer_email ?? '',
        orderNumber: order.order_number,
        customerName: order.customer_name,
        totalAmount: order.total_amount,
        trackingNumber: order.tracking_number,
      });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
