/**
 * Individual Product Variant API Route
 * 
 * Handles CRUD operations for individual product variants
 * Requirements: 2.4, 2.5 - Variant management and pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { requireAdmin } from '@/src/lib/auth/session';

// GET /api/variants/[id] - Get specific product variant
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    
    const { data: variant, error } = await supabase
      .from('variants')
      .select(`
        *,
        model:models(id, name, slug, brand:brands(id, name, slug)),
        product_type:product_types(id, name, slug, base_price, material_properties)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Variant not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch variant' },
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

// PUT /api/variants/[id] - Update specific product variant (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();
    
    const {
      name,
      color_name,
      color_hex,
      price_modifier,
      stock_quantity,
      is_active
    } = body;
    
    if (stock_quantity !== undefined && stock_quantity < 0) {
      return NextResponse.json(
        { error: 'Stock quantity must be non-negative' },
        { status: 400 }
      );
    }
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (name !== undefined) updateData.name = name;
    if (color_name !== undefined) updateData.color_name = color_name;
    if (color_hex !== undefined) updateData.color_hex = color_hex;
    if (price_modifier !== undefined) updateData.price_modifier = price_modifier;
    if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const { data: variant, error } = await supabase
      .from('variants')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        model:models(id, name, slug, brand:brands(id, name, slug)),
        product_type:product_types(id, name, slug, base_price, material_properties)
      `)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Variant not found' },
          { status: 404 }
        );
      }
      
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Variant with this combination already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update variant' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ variant });
  } catch (error) {
    if (error instanceof Error && error.message.includes('unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/variants/[id] - Delete specific product variant (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    const supabase = await createClient();
    const { id } = params;
    
    // Check if variant has associated orders or cart items
    const { data: orders, error: ordersError } = await supabase
      .from('order_items')
      .select('id')
      .eq('variant_id', id)
      .limit(1);
    
    if (ordersError) {
      return NextResponse.json(
        { error: 'Failed to check variant dependencies' },
        { status: 500 }
      );
    }
    
    if (orders && orders.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete variant with existing orders' },
        { status: 409 }
      );
    }
    
    const { error } = await supabase
      .from('variants')
      .delete()
      .eq('id', id);
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Variant not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to delete variant' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}