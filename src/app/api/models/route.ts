/**
 * Models API Route
 * 
 * Handles CRUD operations for smartphone models
 * Requirements: 1.3, 1.4, 11.1 - Model management and hierarchical organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { requireAdmin } from '@/src/lib/auth/session';
// GET /api/models - List all models
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const brandId = searchParams.get('brand_id');
    const active = searchParams.get('active');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('models')
      .select(`
        *,
        brand:brands (
          id,
          name,
          slug,
          logo_url
        )
      `, { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,model_number.ilike.%${search}%`);
    }
    
    if (brandId) {
      query = query.eq('brand_id', brandId);
    }
    
    if (active !== null) {
      query = query.eq('is_active', active === 'true');
    }
    
    const { data: models, error, count } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch models' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      models,
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

// POST /api/models - Create new model (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    const supabase = await createClient();
    const body = await request.json();
    
    const { 
      brand_id, 
      name, 
      model_number, 
      release_year, 
      screen_size, 
      dimensions 
    } = body;
    
    if (!brand_id || !name) {
      return NextResponse.json(
        { error: 'Brand ID and model name are required' },
        { status: 400 }
      );
    }
    
    // Verify brand exists
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brand_id)
      .single();
    
    if (brandError || !brand) {
      return NextResponse.json(
        { error: 'Invalid brand ID' },
        { status: 400 }
      );
    }
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    const { data: model, error } = await supabase
      .from('models')
      .insert({
        brand_id,
        name,
        slug,
        model_number,
        release_year,
        screen_size,
        dimensions,
        is_active: true,
      })
      .select(`
        *,
        brand:brands (
          id,
          name,
          slug,
          logo_url
        )
      `)
      .single();
    
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Model name already exists for this brand' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create model' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ model }, { status: 201 });
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