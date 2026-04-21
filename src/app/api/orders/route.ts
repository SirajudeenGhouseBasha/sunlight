/**
 * Orders API Route
 * 
 * Handles order creation and listing
 * Requirements: 6.4, 6.5, 13.1, 13.2 - Order management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// GET /api/orders - List user's orders
export async function GET(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: orders, error, count } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create order from cart
export async function POST(request: NextRequest) {
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
    
    const body = await request.json();
    const { shipping_address, billing_address, notes } = body;
    
    if (!shipping_address || !billing_address) {
      return NextResponse.json(
        { error: 'Shipping and billing addresses are required' },
        { status: 400 }
      );
    }
    
    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        *,
        variant:variants(
          *,
          model:models(id, name, slug, brand:brands(id, name, slug)),
          product_type:product_types(id, name, slug, base_price)
        ),
        design:designs(id, name, image_url)
      `)
      .eq('user_id', user.id);
    
    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }
    
    // Calculate order totals
    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.total_price.toString()), 0);
    const totalAmount = subtotal;
    
    // Generate order number using database function
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc('generate_order_number');
    
    if (orderNumberError) {
      return NextResponse.json(
        { error: 'Failed to generate order number' },
        { status: 500 }
      );
    }
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumberData,
        status: 'pending',
        payment_status: 'pending',
        subtotal,
        tax_amount: 0,
        shipping_amount: 0,
        discount_amount: 0,
        total_amount: totalAmount,
        shipping_address,
        billing_address,
        notes,
      })
      .select()
      .single();
    
    if (orderError) {
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }
    
    // Create order items from cart
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      variant_id: item.variant_id,
      design_id: item.design_id,
      product_name: `${item.variant.model.brand.name} ${item.variant.model.name}`,
      variant_name: `${item.variant.product_type.name} - ${item.variant.color_name}`,
      design_name: item.design?.name || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      customization_options: item.customization_options,
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) {
      // Rollback order if items creation fails
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      );
    }
    
    // Clear cart after successful order creation
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);
    
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
