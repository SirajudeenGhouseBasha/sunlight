/**
 * Design Templates API
 * 
 * Get admin-managed design templates for predesigned products
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// GET /api/designs/templates - List all design templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    // Build query
    let query = supabase
      .from('designs')
      .select('*')
      .eq('is_template', true)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data: templates, error } = await query;
    
    if (error) {
      console.error('Error fetching design templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch design templates' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Design templates API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/designs/templates - Create new template (Admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      name,
      category,
      thumbnail_url,
      is_featured,
    } = body;
    
    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }
    
    // Create template
    const { data: template, error } = await supabase
      .from('designs')
      .insert({
        name,
        category,
        thumbnail_url: thumbnail_url || null,
        is_featured: is_featured || false,
        is_template: true,
        is_active: true,
        usage_count: 0,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
