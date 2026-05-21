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
        model:models!inner (
          id,
          name,
          slug,
          model_number,
          screen_size,
          mockup_template_url,
          brand:brands!inner (
            id,
            name,
            slug,
            logo_url
          )
        ),
        product_type:product_types!inner (
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
      console.error('Product fetch error:', error);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Handle both array and object responses from Supabase
    const model = Array.isArray(variant.model) ? variant.model[0] : variant.model;
    const brand = model && (Array.isArray(model.brand) ? model.brand[0] : model.brand);
    const productType = Array.isArray(variant.product_type) ? variant.product_type[0] : variant.product_type;
    
    if (!model || !brand || !productType) {
      console.error('Missing required relations:', { model, brand, productType });
      return NextResponse.json(
        { error: 'Product data incomplete' },
        { status: 500 }
      );
    }
    
    // Transform to match expected format
    const product = {
      id: variant.id,
      variant_id: variant.id,
      name: `${brand.name} ${model.name}`,
      brand: brand,
      model: model,
      product_type: productType,
      color_name: variant.color_name,
      color_hex: variant.color_hex,
      price: parseFloat(String(productType.base_price)) + parseFloat(String(variant.price_modifier)),
      base_price: parseFloat(String(productType.base_price)),
      price_modifier: parseFloat(String(variant.price_modifier)),
      stock_quantity: variant.stock_quantity,
      in_stock: variant.stock_quantity > 0,
      is_active: variant.is_active,
      image_url: variant.image_url,
      mask_image_url: variant.mask_image_url,
      mockup_template_url: model.mockup_template_url || null,
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