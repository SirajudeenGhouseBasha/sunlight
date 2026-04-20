/**
 * Session Management Utilities
 * 
 * Provides server-side session validation and management
 * Requirements: 3.4, 10.2 - Session validation and security
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/server';
import { UserRole, userRoles, authRoutes } from '@/src/lib/auth/config';

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  full_name?: string;
  avatar_url?: string;
}

export interface SessionValidationResult {
  user: SessionUser | null;
  session: any;
  error: string | null;
}

/**
 * Validate current session and return user information
 */
export async function validateSession(): Promise<SessionValidationResult> {
  try {
    const supabase = await createClient();
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return {
        user: null,
        session: null,
        error: sessionError.message,
      };
    }

    if (!session?.user) {
      return {
        user: null,
        session: null,
        error: 'No active session',
      };
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, role, is_active')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      return {
        user: null,
        session,
        error: `Profile not found: ${profileError.message}`,
      };
    }

    if (!profile.is_active) {
      return {
        user: null,
        session,
        error: 'Account is suspended',
      };
    }

    return {
      user: profile as SessionUser,
      session,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Require authentication for a page/API route
 * Redirects to login if not authenticated
 */
export async function requireAuth(redirectTo?: string): Promise<SessionUser> {
  const { user, error } = await validateSession();
  
  if (!user || error) {
    const loginUrl = `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
    redirect(loginUrl);
  }
  
  return user;
}

/**
 * Require specific role for a page/API route
 * Redirects to unauthorized page if user doesn't have required role
 */
export async function requireRole(
  requiredRole: UserRole,
  redirectTo?: string
): Promise<SessionUser> {
  const user = await requireAuth(redirectTo);
  
  if (user.role !== requiredRole) {
    redirect('/unauthorized');
  }
  
  return user;
}

/**
 * Require admin role for a page/API route
 */
export async function requireAdmin(redirectTo?: string): Promise<SessionUser> {
  return requireRole(userRoles.ADMIN, redirectTo);
}

/**
 * Get current user without requiring authentication
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const { user } = await validateSession();
  return user;
}

/**
 * Check if current user has specific role
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === requiredRole || false;
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole(userRoles.ADMIN);
}

/**
 * Refresh session tokens
 */
export async function refreshSession(): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sign out user and clear session
 */
export async function signOutUser(): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create or update user profile after authentication
 */
export async function createUserProfile(
  userId: string,
  email: string,
  metadata?: {
    full_name?: string;
    avatar_url?: string;
    role?: UserRole;
  }
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from('users')
        .update({
          email,
          full_name: metadata?.full_name,
          avatar_url: metadata?.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    } else {
      // Create new profile
      const { error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          full_name: metadata?.full_name,
          avatar_url: metadata?.avatar_url,
          role: metadata?.role || userRoles.USER,
          is_active: true,
        });
      
      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }
    
    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Session timeout management
 */
export class SessionManager {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour
  
  static async checkSessionExpiry(): Promise<{
    isExpired: boolean;
    needsRefresh: boolean;
    expiresAt: Date | null;
  }> {
    try {
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          isExpired: true,
          needsRefresh: false,
          expiresAt: null,
        };
      }
      
      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      return {
        isExpired: timeUntilExpiry <= 0,
        needsRefresh: timeUntilExpiry <= this.REFRESH_THRESHOLD,
        expiresAt,
      };
    } catch (error) {
      return {
        isExpired: true,
        needsRefresh: false,
        expiresAt: null,
      };
    }
  }
  
  static async autoRefreshSession(): Promise<boolean> {
    const { needsRefresh, isExpired } = await this.checkSessionExpiry();
    
    if (isExpired) {
      return false;
    }
    
    if (needsRefresh) {
      const { success } = await refreshSession();
      return success;
    }
    
    return true;
  }
}