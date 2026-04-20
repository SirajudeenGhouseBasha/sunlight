/**
 * Individual Variant API Route
 * 
 * Handles operations for a specific variant including multiple images
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// GET /api/variants/[id] - Get single variant
export async function GET(
  request: NextRequest,
  context: any
) {
  console.log('=== VARIANT API DEBUG ===');
  console.log('Request URL:', request.url);
  console.log('Context:', context);
  console.log('Params:', context.params);
  
  try {
    // Handle both sync and async params
    let id: string;
    if (context.params && typeof context.params.then === 'function') {
      const params = await context.params;
      id = params.id;
    } else {
      id = context.params?.id;
    }
    
    console.log('Extracted ID:', id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'No ID provided', debug: { context } },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    const { data: variant, error } = await supabase
      .from('variants')
      .select(`
        id,
        name,
        color_name,
        color_hex,
        price_modifier,
        stock_quantity,
        is_active,
        image_url,
        additional_images,
        created_at,
        model:models (
          id,
          name,
          brand:brands (
            id,
            name,
            logo_url
          )
        ),
        product_type:product_types (
          id,
          name,
          base_price,
          description,
          material
        )
      `)
      .eq('id', id)
      .single();
    
    console.log('Database query result:', { variant, error });
    
    if (error || !variant) {
      console.log('Variant not found, returning 404');
      return NextResponse.json(
        { error: 'Variant not found', debug: { id, error } },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ variant });
  } catch (error) {
    console.error('Variant API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', debug: error },
      { status: 500 }
    );
  }
}

// PATCH /api/variants/[id] - Update variant (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      name,
      color_name,
      color_hex,
      price_modifier,
      stock_quantity,
      image_url,
      additional_images,
      is_active,
    } = body;
    
    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (color_name !== undefined) updates.color_name = color_name;
    if (color_hex !== undefined) updates.color_hex = color_hex;
    if (price_modifier !== undefined) updates.price_modifier = price_modifier;
    if (stock_quantity !== undefined) updates.stock_quantity = stock_quantity;
    if (image_url !== undefined) updates.image_url = image_url;
    if (additional_images !== undefined) updates.additional_images = additional_images;
    if (is_active !== undefined) updates.is_active = is_active;
    
    const { data: variant, error } = await supabase
      .from('variants')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        model:models (
          id,
          name,
          brand:brands (
            id,
            name
          )
        ),
        product_type:product_types (
          id,
          name,
          base_price
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating variant:', error);
      return NextResponse.json(
        { error: 'Failed to update variant' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ variant });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/variants/[id] - Delete variant (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    // Check if variant is used in predesigned products
    const { data: predesignedProducts, error: predesignedError } = await supabase
      .from('predesigned_products')
      .select('id')
      .eq('variant_id', id)
      .limit(1);
    
    if (predesignedError) {
      return NextResponse.json(
        { error: 'Failed to check variant dependencies' },
        { status: 500 }
      );
    }
    
    if (predesignedProducts && predesignedProducts.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete variant used in predesigned products. Remove from products first.' },
        { status: 409 }
      );
    }
    
    const { error } = await supabase
      .from('variants')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete variant' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}