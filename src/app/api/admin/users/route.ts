/**
 * Admin Users API
 * 
 * Manage users, roles, and permissions
 * Requirements: 11.1 - Admin user management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// GET /api/admin/users - List all users with pagination, search, and sorting
export async function GET(request: NextRequest) {
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
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * limit;

    // Allowed sort columns to prevent injection
    const allowedSortColumns = ['email', 'full_name', 'role', 'created_at', 'last_login'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder === 'asc';

    // Build query
    let query = supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at, last_login', { count: 'exact' });

    // Apply search filter (by email or full_name)
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Apply sorting and pagination
    let { data: users, error, count } = await query
      .order(safeSortBy, { ascending })
      .range(offset, offset + limit - 1);
    
    // If last_login column doesn't exist yet (migration pending), retry without it
    if (error && error.message?.includes('last_login')) {
      console.warn('last_login column missing, retrying without it:', error.message);
      let fallbackQuery = supabase
        .from('users')
        .select('id, email, full_name, role, is_active, created_at', { count: 'exact' });
      if (search) {
        fallbackQuery = fallbackQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }
      const fallback = await fallbackQuery
        .order(safeSortBy === 'last_login' ? 'created_at' : safeSortBy, { ascending })
        .range(offset, offset + limit - 1);
      users = (fallback.data ?? []).map(u => ({ ...u, last_login: null }));
      error = fallback.error;
      count = fallback.count;
    }

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
    
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: users ?? [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user (Admin only)
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
    const { email, password, role } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Create user in auth
    const { data: authUser, error: authCreateError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    if (authCreateError || !authUser.user) {
      console.error('Error creating auth user:', authCreateError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
    
    // Create user record in database
    const { data: newUser, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        role: role || 'user',
        is_active: true,
      })
      .select('id, email, full_name, role, is_active, created_at, last_login')
      .single();
    
    if (dbError) {
      console.error('Error creating user record:', dbError);
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - Update user role or status
export async function PATCH(request: NextRequest) {
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
    const { userId, role, is_active } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Prevent admin from demoting themselves
    if (userId === user.id && role === 'user') {
      return NextResponse.json(
        { error: 'You cannot remove your own admin role' },
        { status: 400 }
      );
    }
    
    // Prevent admin from deactivating themselves
    if (userId === user.id && is_active === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      );
    }
    
    // Build update object
    const updates: any = {};
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;
    
    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Admin users update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
