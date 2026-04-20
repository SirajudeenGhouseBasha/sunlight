/**
 * Individual Design API Route
 * 
 * Handles operations for a specific design
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// GET /api/designs/[id] - Get single design
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: design, error } = await supabase
      .from('designs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ design });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/designs/[id] - Update design (Admin only)
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
    const {
      name,
      description,
      category,
      tags,
      is_template,
      is_public,
      is_active,
    } = body;
    
    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;
    if (is_template !== undefined) updates.is_template = is_template;
    if (is_public !== undefined) updates.is_public = is_public;
    if (is_active !== undefined) updates.is_active = is_active;
    
    const { data: design, error } = await supabase
      .from('designs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating design:', error);
      return NextResponse.json(
        { error: 'Failed to update design' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ design });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/designs/[id] - Delete design (Admin only)
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
    
    // Check if design is used in predesigned products
    const { data: predesignedProducts, error: predesignedError } = await supabase
      .from('predesigned_products')
      .select('id')
      .eq('design_id', id)
      .limit(1);
    
    if (predesignedError) {
      return NextResponse.json(
        { error: 'Failed to check design dependencies' },
        { status: 500 }
      );
    }
    
    if (predesignedProducts && predesignedProducts.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete design used in predesigned products. Remove from products first.' },
        { status: 409 }
      );
    }
    
    const { error } = await supabase
      .from('designs')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete design' },
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