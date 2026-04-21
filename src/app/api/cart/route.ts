/**
 * Shopping Cart API Route
 * 
 * Handles cart operations (add, update, remove, get)
 * Requirements: 6.1, 6.2, 6.3 - Cart management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// GET /api/cart - Get user's cart items
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
    
    // Fetch cart items with related data
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        variant:variants(
          *,
          model:models(id, name, slug, brand:brands(id, name, slug)),
          product_type:product_types(id, name, slug, base_price)
        ),
        design:designs(id, name, image_url, thumbnail_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch cart items' },
        { status: 500 }
      );
    }
    
    // Calculate cart totals
    const subtotal = cartItems?.reduce((sum, item) => sum + parseFloat(item.total_price.toString()), 0) || 0;
    
    return NextResponse.json({
      cart_items: cartItems || [],
      summary: {
        subtotal: subtotal.toFixed(2),
        item_count: cartItems?.length || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
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
    const { variant_id, design_id, quantity, customization_options } = body;
    
    if (!variant_id || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Variant ID and valid quantity are required' },
        { status: 400 }
      );
    }
    
    // Get variant details to calculate price
    const { data: variant, error: variantError } = await supabase
      .from('variants')
      .select(`
        *,
        product_type:product_types(base_price)
      `)
      .eq('id', variant_id)
      .single();
    
    if (variantError || !variant) {
      return NextResponse.json(
        { error: 'Invalid variant ID' },
        { status: 400 }
      );
    }
    
    // Calculate unit price (base price + variant modifier)
    const unitPrice = parseFloat(variant.product_type.base_price) + parseFloat(variant.price_modifier);
    
    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('variant_id', variant_id)
      .eq('design_id', design_id || null)
      .maybeSingle();
    
    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + quantity;
      
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)
        .select(`
          *,
          variant:variants(
            *,
            model:models(id, name, slug, brand:brands(id, name, slug)),
            product_type:product_types(id, name, slug, base_price)
          ),
          design:designs(id, name, image_url, thumbnail_url)
        `)
        .single();
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update cart item' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ cart_item: updatedItem });
    }
    
    // Create new cart item
    const { data: cartItem, error } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        variant_id,
        design_id: design_id || null,
        quantity,
        customization_options,
        unit_price: unitPrice,
        total_price: unitPrice * quantity,
      })
      .select(`
        *,
        variant:variants(
          *,
          model:models(id, name, slug, brand:brands(id, name, slug)),
          product_type:product_types(id, name, slug, base_price)
        ),
        design:designs(id, name, image_url, thumbnail_url)
      `)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to add item to cart' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ cart_item: cartItem }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear entire cart
export async function DELETE(request: NextRequest) {
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
    
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to clear cart' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
