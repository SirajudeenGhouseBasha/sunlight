/**
 * Designs API Route
 * 
 * Handles CRUD operations for user designs and templates
 * Requirements: 4.5, 5.1, 5.2 - Design management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
// GET /api/designs - List designs with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const user_id = searchParams.get('user_id');
    const is_template = searchParams.get('is_template');
    const is_public = searchParams.get('is_public');
    const category = searchParams.get('category');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('designs')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    
    if (is_template !== null) {
      query = query.eq('is_template', is_template === 'true');
    }
    
    if (is_public !== null) {
      query = query.eq('is_public', is_public === 'true');
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data: designs, error, count } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch designs' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      designs,
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

// POST /api/designs - Create new design
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    const {
      name,
      description,
      image_url,
      thumbnail_url,
      is_template,
      is_public,
      category,
      tags,
      file_size,
      dimensions,
    } = body;
    
    if (!name || !image_url) {
      return NextResponse.json(
        { error: 'Name and image URL are required' },
        { status: 400 }
      );
    }
    
    // Check if user is admin for template creation
    if (is_template) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!userData || userData.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only admins can create templates' },
          { status: 403 }
        );
      }
    }
    
    const { data: design, error } = await supabase
      .from('designs')
      .insert({
        user_id: user.id,
        name,
        description,
        image_url,
        thumbnail_url,
        is_template: is_template || false,
        is_public: is_public || false,
        category,
        tags,
        file_size,
        dimensions,
        is_active: true,
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to create design' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ design }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
