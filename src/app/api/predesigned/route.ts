/**
 * Predesigned Products API
 *
 * Predesigned cases are standalone products — they reference brand, model,
 * and product_type directly and carry their own images. No variant FK required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// GET /api/predesigned - List all predesigned products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const isActive = searchParams.get('active') !== 'false'; // Default to active only
    const isFeatured = searchParams.get('featured') === 'true';
    const brandId = searchParams.get('brand_id');
    const modelId = searchParams.get('model_id');

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
        color_name,
        color_hex,
        design_image_url,
        variant_image_url,
        additional_image_urls,
        brand:brands ( id, name ),
        model:models ( id, name ),
        product_type:product_types ( id, name, base_price )
      `)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (isActive) {
      query = query.eq('is_active', true);
    }

    if (isFeatured) {
      query = query.eq('is_featured', true);
    }

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    if (modelId) {
      query = query.eq('model_id', modelId);
    }

    const { data: predesignedProducts, error } = await query;

    if (error) {
      console.error('Error fetching predesigned products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch predesigned products' },
        { status: 500 }
      );
    }

    // Calculate final prices using product_type base_price
    const productsWithPrices = (predesignedProducts ?? []).map((product: any) => ({
      ...product,
      final_price: product.price_override ?? product.product_type?.base_price ?? 0,
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

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      brand_id,
      model_id,
      product_type_id,
      name,
      description,
      price_override,
      color_name,
      color_hex,
      design_image_url,
      variant_image_url,
      additional_image_urls,
      is_featured,
      is_active,
      display_order,
    } = body;

    // Validate required fields
    if (!brand_id || !model_id || !product_type_id || !name) {
      return NextResponse.json(
        { error: 'brand_id, model_id, product_type_id, and name are required' },
        { status: 400 }
      );
    }

    const { data: predesignedProduct, error } = await supabase
      .from('predesigned_products')
      .insert({
        brand_id,
        model_id,
        product_type_id,
        name,
        description: description ?? null,
        price_override: price_override ?? null,
        color_name: color_name ?? null,
        color_hex: color_hex ?? null,
        design_image_url: design_image_url ?? null,
        variant_image_url: variant_image_url ?? null,
        additional_image_urls: additional_image_urls ?? [],
        is_featured: is_featured ?? false,
        is_active: is_active !== false,
        display_order: display_order ?? 0,
        // Legacy FKs left null — no longer required
        variant_id: null,
        design_id: null,
      })
      .select(`
        *,
        brand:brands ( id, name ),
        model:models ( id, name ),
        product_type:product_types ( id, name, base_price )
      `)
      .single();

    if (error) {
      console.error('Error creating predesigned product:', error);
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
