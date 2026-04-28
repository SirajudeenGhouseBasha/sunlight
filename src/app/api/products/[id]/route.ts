/**
 * Individual Product API Route
 * 
 * Handles operations for a specific product (variant)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// GET /api/products/[id] - Get single product (variant)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
          slug,
          model_number,
          screen_size,
          brand:brands (
            id,
            name,
            slug,
            logo_url
          )
        ),
        product_type:product_types (
          id,
          name,
          slug,
          base_price,
          description,
          material_properties
        )
      `)
      .eq('id', id)
      .single();
    
    if (error || !variant) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Transform to match expected format
    const product = {
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
      created_at: variant.created_at,
    };
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error('Product API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}