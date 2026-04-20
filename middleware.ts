/**
 * Authentication Middleware for Phone Case Platform
 * 
 * Handles route protection, session validation, and role-based access control
 * Requirements: 3.4, 10.2 - Session validation and authorization
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { authRoutes, userRoles } from '@/src/lib/auth/config';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/orders',
  '/cart',
  '/designs',
  '/checkout',
];

// Routes that require admin role
const adminRoutes = [
  '/admin',
];

// Routes that should redirect authenticated users away
const authOnlyRoutes = [
  '/auth/login',
  '/auth/signup',
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/products',
  '/brands',
  '/models',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get current path
  const path = request.nextUrl.pathname;
  
  // Skip middleware for static files and API routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.') ||
    path === '/favicon.ico'
  ) {
    return response;
  }

  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error in middleware:', sessionError);
    }

    const isAuthenticated = !!session?.user;
    let userRole: string | null = null;
    let userProfile: any = null;

    // Get user profile and role if authenticated
    if (isAuthenticated && session?.user) {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('role, is_active')
          .eq('id', session.user.id)
          .single();
        
        userProfile = profile;
        userRole = profile?.role || userRoles.USER;
      } catch (error) {
        console.error('Error fetching user profile in middleware:', error);
        // Default to user role if profile fetch fails
        userRole = userRoles.USER;
      }
    }

    // Check if user account is active
    if (isAuthenticated && userProfile && !userProfile.is_active) {
      // Redirect inactive users to a suspended account page
      if (path !== '/auth/suspended') {
        return NextResponse.redirect(new URL('/auth/suspended', request.url));
      }
    }

    // Handle auth-only routes (login, signup) - redirect authenticated users
    if (authOnlyRoutes.some(route => path.startsWith(route))) {
      if (isAuthenticated) {
        const redirectTo = request.nextUrl.searchParams.get('redirectTo') || authRoutes.defaultRedirect;
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
      return response;
    }

    // Handle public routes
    if (publicRoutes.some(route => path === route || path.startsWith(route))) {
      return response;
    }

    // Handle admin routes
    if (adminRoutes.some(route => path.startsWith(route))) {
      if (!isAuthenticated) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirectTo', path);
        return NextResponse.redirect(loginUrl);
      }
      
      if (userRole !== userRoles.ADMIN) {
        // Redirect non-admin users to unauthorized page
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      return response;
    }

    // Handle protected routes
    if (protectedRoutes.some(route => path.startsWith(route))) {
      if (!isAuthenticated) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirectTo', path);
        return NextResponse.redirect(loginUrl);
      }
      
      return response;
    }

    // Handle dynamic routes that might need protection
    // Example: /orders/[id], /designs/[id], etc.
    if (path.match(/^\/(orders|designs|profile)\/[^\/]+$/)) {
      if (!isAuthenticated) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirectTo', path);
        return NextResponse.redirect(loginUrl);
      }
      
      return response;
    }

    // Default behavior for unmatched routes
    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    
    // On error, allow the request to proceed but log the issue
    // In production, you might want to redirect to an error page
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};