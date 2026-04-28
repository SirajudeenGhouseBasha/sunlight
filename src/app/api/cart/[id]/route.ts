/**
 * Individual Cart Item API Route
 * 
 * Handles operations on individual cart items
 * Requirements: 6.3 - Cart modification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// PUT /api/cart/[id] - Update cart item
export async function PUT(
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
    const body = await request.json();
    const { quantity, customization_options } = body;
    
    if (quantity !== undefined && quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }
    
    // Verify cart item belongs to user
    const { data: existingItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !existingItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (quantity !== undefined) {
      updateData.quantity = quantity;
      // total_price will be recalculated by trigger
    }
    
    if (customization_options !== undefined) {
      updateData.customization_options = customization_options;
    }
    
    // Update cart item
    const { data: cartItem, error } = await supabase
      .from('cart_items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
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
        { error: 'Failed to update cart item' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ cart_item: cartItem });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/[id] - Remove cart item
export async function DELETE(
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
    
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to remove cart item' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Cart item removed successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
