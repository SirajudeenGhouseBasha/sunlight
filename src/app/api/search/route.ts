import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);

    if (query.length < 1) {
      return NextResponse.json({ products: [] });
    }

    const supabase = await createClient();
    const searchPattern = `%${query}%`;

    const { data: variants, error } = await supabase
      .from('variants')
      .select(`
        id,
        name,
        color_name,
        color_hex,
        price_modifier,
        stock_quantity,
        image_url,
        model:models!inner (
          id,
          name,
          brand:brands!inner (id, name, slug)
        ),
        product_type:product_types!inner (
          id,
          name,
          slug,
          base_price
        )
      `)
      .or(`name.ilike.${searchPattern},color_name.ilike.${searchPattern}`)
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    const products = (variants || []).map((v: any) => {
      const model = Array.isArray(v.model) ? v.model[0] : v.model;
      const brand = model ? (Array.isArray(model.brand) ? model.brand[0] : model.brand) : null;
      const productType = Array.isArray(v.product_type) ? v.product_type[0] : v.product_type;
      const basePrice = parseFloat(productType?.base_price || 0);
      const modifier = parseFloat(v.price_modifier || 0);
      const price = basePrice + modifier;

      return {
        id: v.id,
        name: `${brand?.name || ''} ${model?.name || ''} - ${v.color_name || ''}`.trim(),
        brand_name: brand?.name || '',
        model_name: model?.name || '',
        color_name: v.color_name,
        color_hex: v.color_hex,
        price,
        image_url: v.image_url,
        in_stock: v.stock_quantity > 0,
      };
    });

    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
