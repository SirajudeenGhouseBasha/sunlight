/**
 * Products API Route
 * 
 * Handles product catalog with search and filtering
 * Requirements: 12.1, 12.2, 12.3 - Search and discovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { createProductResponse } from '@/src/lib/cache/http-cache';

// GET /api/products - Search and filter products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const brand_id = searchParams.get('brand_id');
    const model_id = searchParams.get('model_id');
    const product_type_id = searchParams.get('product_type_id');
    const in_stock = searchParams.get('in_stock');
    
    const offset = (page - 1) * limit;
    
    // Build query for variants with related data
    let query = supabase
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
        model:models!inner(
          id,
          name,
          slug,
          model_number,
          screen_size,
          brand:brands!inner(id, name, slug, logo_url)
        ),
        product_type:product_types!inner(id, name, slug, base_price, description, material_properties)
      `, { count: 'planned' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply search filter
    if (search) {
      query = query.or(`model.name.ilike.%${search}%,model.brand.name.ilike.%${search}%,product_type.name.ilike.%${search}%`);
    }
    
    // Apply brand filter
    if (brand_id) {
      query = query.eq('model.brand_id', brand_id);
    }
    
    // Apply model filter
    if (model_id) {
      query = query.eq('model_id', model_id);
    }
    
    // Apply product type filter (by ID)
    if (product_type_id) {
      query = query.eq('product_type_id', product_type_id);
    }
    
    // Apply category filter (by slug)
    const category = searchParams.get('category');
    if (category) {
      query = query.eq('product_type.slug', category);
    }
    
    // Apply stock filter
    if (in_stock === 'true') {
      query = query.gt('stock_quantity', 0);
    }
    
    const { data: variants, error, count } = await query;
    
    if (error) {
      console.error('Products fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }
    
    // Transform variants into product catalog format
    const products = variants?.map(variant => ({
      id: variant.id,
      variant_id: variant.id,
      name: `${variant.model.brand.name} ${variant.model.name}`,
      brand: variant.model.brand,
      model: variant.model,
      product_type: variant.product_type,
      color_name: variant.color_name,
      color_hex: variant.color_hex,
      price: parseFloat(variant.product_type.base_price) + parseFloat(variant.price_modifier),
      base_price: parseFloat(variant.product_type.base_price),
      price_modifier: parseFloat(variant.price_modifier),
      stock_quantity: variant.stock_quantity,
      in_stock: variant.stock_quantity > 0,
      is_active: variant.is_active,
      image_url: variant.image_url,
      additional_images: variant.additional_images || [],
    })) || [];
    
    return createProductResponse({
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
