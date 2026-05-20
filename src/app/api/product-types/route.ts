/**
 * Product Types API Route
 * 
 * Handles CRUD operations for product types (Silicone, Glass, Clear, etc.)
 * Requirements: 2.1, 2.2, 2.3 - Product type management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { validateAdminAccess } from '@/src/lib/auth/api-auth';
import { PRODUCT_TYPES } from '@/src/types/products';

// GET /api/product-types - List all product types
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');

    const offset = (page - 1) * limit;

    // First, get the total count with all filters applied
    let countQuery = supabase
      .from('product_types')
      .select('id', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.ilike('name', `%${search}%`);
    }

    if (active !== null) {
      countQuery = countQuery.eq('is_active', active === 'true');
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Count error:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch product types count' },
        { status: 500 }
      );
    }

    // Then get the paginated data
    let dataQuery = supabase
      .from('product_types')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      dataQuery = dataQuery.ilike('name', `%${search}%`);
    }

    if (active !== null) {
      dataQuery = dataQuery.eq('is_active', active === 'true');
    }

    const { data: product_types, error } = await dataQuery;

    if (error) {
      console.error('Data fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product types' },
        { status: 500 }
      );
    }

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      product_types: product_types || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('GET /api/product-types error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/product-types - Create new product type (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication
    const auth = await validateAdminAccess();
    if (!auth.isValid) {
      return auth.response;
    }
    
    const supabase = await createClient();
    const body = await request.json();
    
    const { name, description, material_properties, base_price } = body;
    
    if (!name || base_price === undefined) {
      return NextResponse.json(
        { error: 'Name and base price are required' },
        { status: 400 }
      );
    }
    
    if (base_price < 0) {
      return NextResponse.json(
        { error: 'Base price must be non-negative' },
        { status: 400 }
      );
    }
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    const { data: product_type, error } = await supabase
      .from('product_types')
      .insert({
        name,
        slug,
        description,
        material_properties,
        base_price,
        is_active: true,
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Product type name already exists' },
          { status: 409 }
        );
      }
      
      console.error('Product type insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create product type' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ product_type }, { status: 201 });
  } catch (error) {
    console.error('POST /api/product-types error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/product-types - Seed default product types (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Validate admin authentication
    const auth = await validateAdminAccess();
    if (!auth.isValid) {
      return auth.response;
    }
    
    const supabase = await createClient();
    
    // Insert default product types
    const defaultTypes = Object.values(PRODUCT_TYPES).map(type => ({
      name: type.name,
      slug: type.slug,
      description: type.description,
      material_properties: type.material_properties,
      base_price: type.base_price,
      is_active: true,
    }));
    
    const { data: product_types, error } = await supabase
      .from('product_types')
      .upsert(defaultTypes, { 
        onConflict: 'slug',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) {
      console.error('Product types seed error:', error);
      return NextResponse.json(
        { error: 'Failed to seed product types' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Product types seeded successfully',
      product_types 
    });
  } catch (error) {
    console.error('PUT /api/product-types error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}