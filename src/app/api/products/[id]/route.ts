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
        mask_image_url,
        additional_images,
        created_at,
        model:models (
          id,
          name,
          slug,
          model_number,
          screen_size,
          mockup_template_url,
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
    const v = variant as any;
    
    // Transform to match expected format
    const product = {
      id: v.id,
      variant_id: v.id,
      name: `${v.model.brand.name} ${v.model.name}`,
      brand: v.model.brand,
      model: v.model,
      product_type: v.product_type,
      color_name: v.color_name,
      color_hex: v.color_hex,
      price: parseFloat(v.product_type.base_price) + parseFloat(v.price_modifier),
      base_price: parseFloat(v.product_type.base_price),
      price_modifier: parseFloat(v.price_modifier),
      stock_quantity: v.stock_quantity,
      in_stock: v.stock_quantity > 0,
      is_active: v.is_active,
      image_url: v.image_url,
      mask_image_url: v.mask_image_url,
      mockup_template_url: v.model?.mockup_template_url || null,
      additional_images: v.additional_images || [],
      created_at: v.created_at,
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