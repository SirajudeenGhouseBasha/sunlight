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
