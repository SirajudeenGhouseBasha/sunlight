/**
 * Individual Product Type API Route
 * 
 * Handles CRUD operations for individual product types
 * Requirements: 2.1, 2.2, 2.3 - Product type management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { requireAdmin } from '@/src/lib/auth/session';

// GET /api/product-types/[id] - Get specific product type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    
    const { data: product_type, error } = await supabase
      .from('product_types')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product type not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch product type' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ product_type });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/product-types/[id] - Update specific product type (Admin only)
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
    
    const { name, description, material_properties, base_price, is_active } = body;
    
    if (!name || base_price === undefined) {
      return NextResponse.json(
        { error: 'Name and base price are required' },
        { status: 400 }
      );
    }
    
    if (base_price < 0) {
      return NextResponse.json(
        { error: 'Base price must be non-negative' },
        { status: 400 }
      );
    }
    
    // Generate slug from name if name changed
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    const { data: product_type, error } = await supabase
      .from('product_types')
      .update({
        name,
        slug,
        description,
        material_properties,
        base_price,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product type not found' },
          { status: 404 }
        );
      }
      
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Product type name already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update product type' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ product_type });
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

// DELETE /api/product-types/[id] - Delete specific product type (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    const supabase = await createClient();
    const { id } = params;
    
    // Check if product type has associated variants
    const { data: variants, error: variantsError } = await supabase
      .from('variants')
      .select('id')
      .eq('product_type_id', id)
      .limit(1);
    
    if (variantsError) {
      return NextResponse.json(
        { error: 'Failed to check product type dependencies' },
        { status: 500 }
      );
    }
    
    if (variants && variants.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product type with existing variants' },
        { status: 409 }
      );
    }
    
    const { error } = await supabase
      .from('product_types')
      .delete()
      .eq('id', id);
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product type not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to delete product type' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Product type deleted successfully' });
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