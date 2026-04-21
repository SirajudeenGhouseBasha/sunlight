/**
 * Product Types API Route
 * 
 * Handles CRUD operations for product types (Silicone, Glass, Clear, etc.)
 * Requirements: 2.1, 2.2, 2.3 - Product type management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { requireAdmin } from '@/src/lib/auth/session';
import { PRODUCT_TYPES } from '@/src/types/products';
import { createCachedResponse, CACHE_CONTROL } from '@/src/lib/cache/http-cache';

// GET /api/product-types - List all product types
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const active = searchParams.get('active');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('product_types')
      .select('*', { count: 'planned' })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (active !== null) {
      query = query.eq('is_active', active === 'true');
    }
    
    const { data: product_types, error, count } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch product types' },
        { status: 500 }
      );
    }
    
    return createCachedResponse({
      product_types,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }, {
      cacheControl: CACHE_CONTROL.MEDIUM,
      etag: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/product-types - Create new product type (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();
    
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
      
      return NextResponse.json(
        { error: 'Failed to create product type' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ product_type }, { status: 201 });
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

// POST /api/product-types/seed - Seed default product types (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();
    
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