/**
 * Featured Products API
 * 
 * Returns featured/trending products
 * Requirements: 12.4 - Product discovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { createProductResponse } from '@/src/lib/cache/http-cache';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '8')));

    const supabase = await createClient();

    // Get featured products (in stock, active, random selection)
    const { data: variants, error } = await supabase
      .from('variants')
      .select(`
        id,
        color_name,
        color_hex,
        price_modifier,
        stock_quantity,
        is_active,
        image_url,
        additional_images,
        model:models!inner(
          id,
          name,
          brand:brands!inner(
            id,
            name
          )
        ),
        product_type:product_types!inner(
          id,
          name,
          base_price
        )
      `)
      .eq('is_active', true)
      .eq('model.is_active', true)
      .eq('model.brand.is_active', true)
      .eq('product_type.is_active', true)
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch featured products' },
        { status: 500 }
      );
    }

    // Format products
    const products = (variants || []).map((variant: any) => ({
      id: variant.id,
      variant_id: variant.id,
      name: `${variant.model.brand.name} ${variant.model.name}`,
      brand: variant.model.brand.name,
      model: variant.model.name,
      product_type: variant.product_type.name,
      color_name: variant.color_name,
      color_hex: variant.color_hex,
      price: variant.product_type.base_price + variant.price_modifier,
      in_stock: variant.stock_quantity > 0,
      image_url: variant.image_url,
      additional_images: variant.additional_images || [],
    }));

    return createProductResponse({ products });
  } catch (error) {
    console.error('Featured products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}
