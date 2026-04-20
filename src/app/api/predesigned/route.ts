/**
 * Predesigned Products API
 * 
 * Manage predesigned cases (variant + design combinations)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// GET /api/predesigned - List all predesigned products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const isFeatured = searchParams.get('featured') === 'true';
    const isActive = searchParams.get('active') !== 'false'; // Default to active only
    const brandId = searchParams.get('brand_id');
    const modelId = searchParams.get('model_id');
    
    // Build query with joins
    let query = supabase
      .from('predesigned_products')
      .select(`
        id,
        name,
        description,
        price_override,
        is_featured,
        is_active,
        display_order,
        created_at,
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
            base_price
          ),
          model:models (
            id,
            name,
            brand:brands (
              id,
              name
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
          tags
        )
      `)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (isActive) {
      query = query.eq('is_active', true);
    }
    
    if (isFeatured) {
      query = query.eq('is_featured', true);
    }
    
    const { data: predesignedProducts, error } = await query;
    
    if (error) {
      console.error('Error fetching predesigned products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch predesigned products' },
        { status: 500 }
      );
    }
    
    // Filter by brand/model if specified (post-query filtering)
    let filteredProducts = predesignedProducts;
    
    if (brandId) {
      filteredProducts = filteredProducts?.filter(
        (p: any) => p.variant?.model?.brand?.id === brandId
      );
    }
    
    if (modelId) {
      filteredProducts = filteredProducts?.filter(
        (p: any) => p.variant?.model?.id === modelId
      );
    }
    
    // Calculate final prices
    const productsWithPrices = filteredProducts?.map((product: any) => ({
      ...product,
      final_price: product.price_override || product.variant?.price || product.variant?.product_type?.base_price || 0,
    }));
    
    return NextResponse.json({ predesigned_products: productsWithPrices });
  } catch (error) {
    console.error('Predesigned products API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/predesigned - Create new predesigned product
export async function POST(request: NextRequest) {
  try {
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
      variant_id,
      design_id,
      name,
      description,
      price_override,
      is_featured,
      is_active,
      display_order,
    } = body;
    
    // Validate required fields
    if (!variant_id || !design_id || !name) {
      return NextResponse.json(
        { error: 'variant_id, design_id, and name are required' },
        { status: 400 }
      );
    }
    
    // Create predesigned product
    const { data: predesignedProduct, error } = await supabase
      .from('predesigned_products')
      .insert({
        variant_id,
        design_id,
        name,
        description,
        price_override,
        is_featured: is_featured || false,
        is_active: is_active !== false, // Default to true
        display_order: display_order || 0,
      })
      .select(`
        *,
        variant:variants (
          id,
          sku,
          color_name,
          price,
          model:models (
            id,
            name,
            brand:brands (
              id,
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
      console.error('Error creating predesigned product:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This variant and design combination already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create predesigned product' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ predesigned_product: predesignedProduct }, { status: 201 });
  } catch (error) {
    console.error('Create predesigned product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
