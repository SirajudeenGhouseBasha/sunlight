/**
 * Product Variants API Route
 * 
 * Handles CRUD operations for product variants (colors, pricing, inventory)
 * Requirements: 2.4, 2.5 - Variant management and pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { requireAdmin } from '@/src/lib/auth/session';

// GET /api/variants - List product variants with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const model_id = searchParams.get('model_id');
    const product_type_id = searchParams.get('product_type_id');
    const active = searchParams.get('active');
    const in_stock = searchParams.get('in_stock');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('variants')
      .select(`
        *,
        model:models(id, name, slug, brand:brands(id, name, slug)),
        product_type:product_types(id, name, slug, base_price)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (model_id) {
      query = query.eq('model_id', model_id);
    }
    
    if (product_type_id) {
      query = query.eq('product_type_id', product_type_id);
    }
    
    if (active !== null) {
      query = query.eq('is_active', active === 'true');
    }
    
    if (in_stock === 'true') {
      query = query.gt('stock_quantity', 0);
    }
    
    const { data: variants, error, count } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch variants' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      variants,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/variants - Create new product variant (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      model_id,
      product_type_id,
      name,
      color_name,
      color_hex,
      price_modifier,
      stock_quantity
    } = body;
    
    if (!model_id || !product_type_id || !color_name || price_modifier === undefined) {
      return NextResponse.json(
        { error: 'Model ID, product type ID, color name, and price modifier are required' },
        { status: 400 }
      );
    }
    
    if (stock_quantity < 0) {
      return NextResponse.json(
        { error: 'Stock quantity must be non-negative' },
        { status: 400 }
      );
    }
    
    // Verify model and product type exist
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('id, name')
      .eq('id', model_id)
      .single();
    
    if (modelError || !model) {
      return NextResponse.json(
        { error: 'Invalid model ID' },
        { status: 400 }
      );
    }
    
    const { data: productType, error: productTypeError } = await supabase
      .from('product_types')
      .select('id, name')
      .eq('id', product_type_id)
      .single();
    
    if (productTypeError || !productType) {
      return NextResponse.json(
        { error: 'Invalid product type ID' },
        { status: 400 }
      );
    }
    
    // Generate variant name if not provided
    const variantName = name || `${model.name} ${productType.name} - ${color_name}`;
    
    const { data: variant, error } = await supabase
      .from('variants')
      .insert({
        model_id,
        product_type_id,
        name: variantName,
        color_name,
        color_hex,
        price_modifier: price_modifier || 0,
        stock_quantity: stock_quantity || 0,
        is_active: true,
      })
      .select(`
        *,
        model:models(id, name, slug, brand:brands(id, name, slug)),
        product_type:product_types(id, name, slug, base_price)
      `)
      .single();
    
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Variant with this combination already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create variant' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/variants/bulk - Bulk create variants for multiple models (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    const supabase = await createClient();
    const body = await request.json();
    
    const { model_ids, product_type_id, variants_data } = body;
    
    if (!model_ids || !Array.isArray(model_ids) || !product_type_id || !variants_data) {
      return NextResponse.json(
        { error: 'Model IDs array, product type ID, and variants data are required' },
        { status: 400 }
      );
    }
    
    // Verify product type exists
    const { data: productType, error: productTypeError } = await supabase
      .from('product_types')
      .select('id, name')
      .eq('id', product_type_id)
      .single();
    
    if (productTypeError || !productType) {
      return NextResponse.json(
        { error: 'Invalid product type ID' },
        { status: 400 }
      );
    }
    
    // Get models data
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('id, name')
      .in('id', model_ids);
    
    if (modelsError || !models || models.length !== model_ids.length) {
      return NextResponse.json(
        { error: 'One or more invalid model IDs' },
        { status: 400 }
      );
    }
    
    // Create variants for each model
    const variantsToInsert = [];
    
    for (const model of models) {
      for (const variantData of variants_data) {
        const variantName = `${model.name} ${productType.name} - ${variantData.color_name}`;
        
        variantsToInsert.push({
          model_id: model.id,
          product_type_id,
          name: variantName,
          color_name: variantData.color_name,
          color_hex: variantData.color_hex,
          price_modifier: variantData.price_modifier || 0,
          stock_quantity: variantData.stock_quantity || 0,
          is_active: true,
        });
      }
    }
    
    const { data: variants, error } = await supabase
      .from('variants')
      .upsert(variantsToInsert, { 
        onConflict: 'model_id,product_type_id,color_name',
        ignoreDuplicates: false 
      })
      .select(`
        *,
        model:models(id, name, slug),
        product_type:product_types(id, name, slug, base_price)
      `);
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to create bulk variants' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      message: `Created ${variants?.length || 0} variants successfully`,
      variants 
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}