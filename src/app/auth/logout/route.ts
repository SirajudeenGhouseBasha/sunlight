/**
 * Logout Route Handler
 * 
 * Handles user logout and session cleanup
 * Requirements: 3.4 - Session management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { authRoutes } from '@/src/lib/auth/config';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Sign out the user
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      return NextResponse.redirect(new URL('/dashboard?error=logout_failed', request.url));
    }
    
    // Redirect to home page after successful logout
    return NextResponse.redirect(new URL(authRoutes.logoutRedirect, request.url));
  } catch (error) {
    console.error('Unexpected logout error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=logout_failed', request.url));
  }
}

// Also handle GET requests for direct navigation
export async function GET(request: NextRequest) {
  return POST(request);
}