/**
 * Related Products API
 * 
 * Returns related products based on current product
 * Requirements: 12.4 - Product recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const variantId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '4');

    const supabase = await createClient();

    // Get the current variant details
    const { data: currentVariant } = await supabase
      .from('variants')
      .select(`
        model_id,
        product_type_id,
        model:models(brand_id)
      `)
      .eq('id', variantId)
      .single();

    if (!currentVariant) {
      return NextResponse.json({ products: [] });
    }

    // Find related products:
    // 1. Same model, different colors
    // 2. Same brand, different models
    // 3. Same product type
    const { data: variants, error } = await supabase
      .from('variants')
      .select(`
        id,
        color_name,
        color_hex,
        price_modifier,
        stock_quantity,
        is_active,
        model_id,
        product_type_id,
        model:models!inner(
          id,
          name,
          brand_id,
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
      .neq('id', variantId)
      .eq('is_active', true)
      .eq('model.is_active', true)
      .eq('model.brand.is_active', true)
      .eq('product_type.is_active', true)
      .gt('stock_quantity', 0)
      .limit(limit * 3); // Get more for scoring

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch related products' },
        { status: 500 }
      );
    }

    // Score and sort by relevance
    const scored = (variants || []).map((variant: any) => {
      let score = 0;
      
      // Same model (highest priority)
      if (variant.model_id === currentVariant.model_id) {
        score += 100;
      }
      
      // Same brand
      if (variant.model.brand_id === currentVariant.model.brand_id) {
        score += 50;
      }
      
      // Same product type
      if (variant.product_type_id === currentVariant.product_type_id) {
        score += 30;
      }
      
      // Add some randomness
      score += Math.random() * 10;
      
      return { variant, score };
    });

    // Sort by score and take top results
    const topResults = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ variant }) => variant);

    // Format products
    const products = topResults.map((variant: any) => ({
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
    console.error('Related products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related products' },
      { status: 500 }
    );
  }
}
