/**
 * Predesigned Product Detail API
 * 
 * Get, update, or delete a specific predesigned product
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// GET /api/predesigned/[id] - Get single predesigned product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: predesignedProduct, error } = await supabase
      .from('predesigned_products')
      .select(`
        *,
        variant:variants (
          id,
          sku,
          color_name,
          color_hex,
          price,
          stock_quantity,
          image_url,
          product_type:product_types (
            id,
            name,
            base_price,
            description,
            material,
            finish
          ),
          model:models (
            id,
            name,
            screen_size,
            brand:brands (
              id,
              name,
              logo_url
            )
          )
        ),
        design:designs (
          id,
          name,
          description,
          image_url,
          thumbnail_url,
          category,
          tags,
          usage_count
        )
      `)
      .eq('id', id)
      .single();
    
    if (error || !predesignedProduct) {
      return NextResponse.json(
        { error: 'Predesigned product not found' },
        { status: 404 }
      );
    }
    
    // Calculate final price
    const final_price = predesignedProduct.price_override || 
                       predesignedProduct.variant?.price || 
                       predesignedProduct.variant?.product_type?.base_price || 
                       0;
    
    return NextResponse.json({
      predesigned_product: {
        ...predesignedProduct,
        final_price,
      },
    });
  } catch (error) {
    console.error('Get predesigned product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/predesigned/[id] - Update predesigned product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      description,
      price_override,
      is_featured,
      is_active,
      display_order,
    } = body;
    
    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price_override !== undefined) updates.price_override = price_override;
    if (is_featured !== undefined) updates.is_featured = is_featured;
    if (is_active !== undefined) updates.is_active = is_active;
    if (display_order !== undefined) updates.display_order = display_order;
    
    // Update predesigned product
    const { data: predesignedProduct, error } = await supabase
      .from('predesigned_products')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        variant:variants (
          id,
          sku,
          color_name,
          price,
          model:models (
            name,
            brand:brands (
              name
            )
          )
        ),
        design:designs (
          id,
          name,
          image_url
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating predesigned product:', error);
      return NextResponse.json(
        { error: 'Failed to update predesigned product' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ predesigned_product: predesignedProduct });
  } catch (error) {
    console.error('Update predesigned product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/predesigned/[id] - Delete predesigned product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    
    // Delete predesigned product
    const { error } = await supabase
      .from('predesigned_products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting predesigned product:', error);
      return NextResponse.json(
        { error: 'Failed to delete predesigned product' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete predesigned product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
