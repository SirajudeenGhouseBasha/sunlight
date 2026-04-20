/**
 * Featured Products API
 * 
 * Returns featured/trending products
 * Requirements: 12.4 - Product discovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '8');

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
      .limit(limit * 2); // Get more to randomize

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch featured products' },
        { status: 500 }
      );
    }

    // Randomize and limit results
    const shuffled = (variants || [])
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);

    // Format products
    const products = shuffled.map((variant: any) => ({
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
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Featured products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}
