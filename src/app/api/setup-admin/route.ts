/**
 * Setup Admin API
 * 
 * First-time admin setup endpoint
 * Allows the first user to become admin without requiring scripts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email } = body;
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Check if any admin exists
    const { data: existingAdmins, error: adminCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);
    
    if (adminCheckError) {
      console.error('Error checking for existing admins:', adminCheckError);
      return NextResponse.json(
        { error: 'Failed to check admin status' },
        { status: 500 }
      );
    }
    
    // If admin already exists, prevent setup
    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json(
        { error: 'Admin already exists. Use the admin panel to manage roles.' },
        { status: 403 }
      );
    }
    
    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email.toLowerCase().trim())
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found. Please sign up first.' },
        { status: 404 }
      );
    }
    
    // Update user to admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating user to admin:', updateError);
      return NextResponse.json(
        { error: 'Failed to grant admin access' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Admin access granted successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
    
  } catch (error) {
    console.error('Setup admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
