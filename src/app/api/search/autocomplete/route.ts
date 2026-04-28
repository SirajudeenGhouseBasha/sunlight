/**
 * Search Autocomplete API
 * 
 * Provides real-time search suggestions
 * Requirements: 12.1, 12.3 - Search autocomplete
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { createSearchResponse } from '@/src/lib/cache/http-cache';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const supabase = await createClient();
    const searchPattern = `%${query}%`;

    const [brandsResult, modelsResult, productsResult] = await Promise.all([
      supabase
        .from('brands')
        .select('id, name')
        .ilike('name', searchPattern)
        .eq('is_active', true)
        .limit(3),
      supabase
        .from('models')
        .select('id, name, brand:brands(name)')
        .ilike('name', searchPattern)
        .eq('is_active', true)
        .limit(3),
      supabase
        .from('variants')
        .select(`
          id,
          color_name,
          model:models(id, name, brand:brands(name)),
          product_type:product_types(name)
        `)
        .or(`color_name.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(4),
    ]);

    const brands = brandsResult.data;
    const models = modelsResult.data;
    const products = productsResult.data;

    // Format suggestions
    const suggestions = [
      ...(brands || []).map((brand) => ({
        type: 'brand' as const,
        id: brand.id,
        name: brand.name,
      })),
      ...(models || []).map((model) => ({
        type: 'model' as const,
        id: model.id,
        name: model.name,
        subtitle: model.brand?.name,
      })),
      ...(products || []).map((product) => ({
        type: 'product' as const,
        id: product.id,
        variant_id: product.id,
        name: `${product.model?.brand?.name} ${product.model?.name} - ${product.color_name}`,
        subtitle: product.product_type?.name,
      })),
    ];

    return createSearchResponse({ suggestions });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
