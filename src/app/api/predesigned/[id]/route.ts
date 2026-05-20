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
        brand:brands ( id, name ),
        model:models ( id, name ),
        product_type:product_types ( id, name, base_price )
      `)
      .eq('id', id)
      .single();

    if (error || !predesignedProduct) {
      return NextResponse.json(
        { error: 'Predesigned product not found' },
        { status: 404 }
      );
    }

    const final_price =
      predesignedProduct.price_override ??
      predesignedProduct.product_type?.base_price ??
      0;

    return NextResponse.json({
      predesigned_product: { ...predesignedProduct, final_price },
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
      color_name,
      color_hex,
      design_image_url,
      variant_image_url,
      additional_image_urls,
      is_featured,
      is_active,
      display_order,
    } = body;

    // Build update object
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price_override !== undefined) updates.price_override = price_override;
    if (color_name !== undefined) updates.color_name = color_name;
    if (color_hex !== undefined) updates.color_hex = color_hex;
    if (design_image_url !== undefined) updates.design_image_url = design_image_url;
    if (variant_image_url !== undefined) updates.variant_image_url = variant_image_url;
    if (additional_image_urls !== undefined) updates.additional_image_urls = additional_image_urls;
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
        brand:brands ( id, name ),
        model:models ( id, name ),
        product_type:product_types ( id, name, base_price )
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
