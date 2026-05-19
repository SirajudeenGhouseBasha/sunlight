/**
* Brands API Route
* 
* Handles CRUD operations for smartphone brands
* Requirements: 1.2, 1.3, 11.1 - Brand management and admin interfaces
*/

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { validateAdminAccess } from '@/src/lib/auth/api-auth';
import { createCachedResponse, CACHE_CONTROL } from '@/src/lib/cache/http-cache';

// GET /api/brands - List all brands
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
      .from('brands')
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
        { error: 'Failed to fetch brands count' },
        { status: 500 }
      );
    }

    // Then get the paginated data
    let dataQuery = supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      dataQuery = dataQuery.ilike('name', `%${search}%`);
    }

    if (active !== null) {
      dataQuery = dataQuery.eq('is_active', active === 'true');
    }

    const { data: brands, error } = await dataQuery;

    if (error) {
      console.error('Data fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch brands' },
        { status: 500 }
      );
    }

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      brands: brands || [],
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
    console.error('GET /api/brands error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/brands - Create new brand (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication
    const auth = await validateAdminAccess();
    if (!auth.isValid) {
      return auth.response;
    }

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

    const { data: brand, error: insertError } = await supabase
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

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Brand name already exists' },
          { status: 409 }
        );
      }

      console.error('Brand insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create brand' },
        { status: 500 }
      );
    }

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    console.error('POST /api/brands error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}