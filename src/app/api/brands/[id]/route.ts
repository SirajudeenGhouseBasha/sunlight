/**
 * Individual Brand API Route
 * 
 * Handles operations for a specific brand
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// GET /api/brands/[id] - Get single brand
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: brand, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ brand });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/brands/[id] - Update brand (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .update({
        name,
        slug,
        description,
        logo_url,
      })
      .eq('id', id)
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
        { error: 'Failed to update brand' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ brand });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/brands/[id] - Delete brand (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    
    // Check if brand has associated models
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('id')
      .eq('brand_id', id)
      .limit(1);
    
    if (modelsError) {
      return NextResponse.json(
        { error: 'Failed to check brand dependencies' },
        { status: 500 }
      );
    }
    
    if (models && models.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete brand with associated models. Delete models first.' },
        { status: 409 }
      );
    }
    
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete brand' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}