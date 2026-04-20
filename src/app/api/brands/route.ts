/**
 * Brands API Route
 * 
 * Handles CRUD operations for smartphone brands
 * Requirements: 1.2, 1.3, 11.1 - Brand management and admin interfaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { requireAdmin } from '@/src/lib/auth/session';

// GET /api/brands - List all brands
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('brands')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    if (active !== null) {
      query = query.eq('is_active', active === 'true');
    }
    
    const { data: brands, error, count } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch brands' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      brands,
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

// POST /api/brands - Create new brand (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    const supabase = await createClient();
    const body = await request.json();
    
    const { name, description, logo_url } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    const { data: brand, error } = await supabase
      .from('brands')
      .insert({
        name,
        slug,
        description,
        logo_url,
        is_active: true,
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Brand name already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create brand' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ brand }, { status: 201 });
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