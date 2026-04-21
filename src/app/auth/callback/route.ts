/**
 * Authentication Callback Route
 * 
 * Handles OAuth callbacks and email confirmations from Supabase
 * Requirements: 3.1, 3.2, 3.3 - Authentication integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { authRoutes } from '@/src/lib/auth/config';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? authRoutes.defaultRedirect;
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    try {
      const supabase = await createClient();
      
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        return NextResponse.redirect(
          `${origin}/auth/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
        );
      }

      if (data.user) {
        // Check if user profile exists in our users table
        const { data: existingProfile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        // Create user profile if it doesn't exist
        if (!existingProfile && !profileError) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
              avatar_url: data.user.user_metadata?.avatar_url,
              role: 'user',
              is_active: true,
            });

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            // Don't fail the authentication, just log the error
          }
        }

        // Successful authentication - redirect to intended destination
        const redirectUrl = next.startsWith('/') ? `${origin}${next}` : `${origin}${authRoutes.defaultRedirect}`;
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`
      );
    }
  }

  // No code parameter - redirect to login
  return NextResponse.redirect(`${origin}/auth/login`);
}

// Handle POST requests (for some OAuth flows)
export async function POST(request: NextRequest) {
  return GET(request);
}