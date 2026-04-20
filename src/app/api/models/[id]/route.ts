/**
 * Individual Model API Route
 * 
 * Handles operations for a specific model
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// GET /api/models/[id] - Get single model
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: model, error } = await supabase
      .from('models')
      .select(`
        *,
        brand:brands (
          id,
          name,
          logo_url
        )
      `)
      .eq('id', id)
      .single();
    
    if (error || !model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ model });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/models/[id] - Update model (Admin only)
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
    const { brand_id, name, model_number, screen_size, release_year } = body;
    
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
    
    const { data: model, error } = await supabase
      .from('models')
      .update({
        brand_id,
        name,
        model_number,
        screen_size,
        release_year,
      })
      .eq('id', id)
      .select(`
        *,
        brand:brands (
          id,
          name,
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
        { error: 'Failed to update model' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ model });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/models/[id] - Delete model (Admin only)
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
    
    // Check if model has associated variants
    const { data: variants, error: variantsError } = await supabase
      .from('variants')
      .select('id')
      .eq('model_id', id)
      .limit(1);
    
    if (variantsError) {
      return NextResponse.json(
        { error: 'Failed to check model dependencies' },
        { status: 500 }
      );
    }
    
    if (variants && variants.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete model with associated variants. Delete variants first.' },
        { status: 409 }
      );
    }
    
    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete model' },
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