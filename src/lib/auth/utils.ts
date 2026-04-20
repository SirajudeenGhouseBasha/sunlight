/**
 * Authentication Utilities for Phone Case Platform
 * 
 * Provides utility functions for authentication, authorization, and user management
 * Requirements: 3.1, 3.2, 3.3 - Authentication integration and user management
 */

import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase/client';
import { 
  UserRole, 
  userRoles, 
  rolePermissions, 
  authErrors, 
  validationPatterns,
  authRoutes 
} from './config';

// Types
export interface AuthUser extends User {
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    role?: UserRole;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  shipping_address?: any;
  billing_address?: any;
  preferences?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

// Validation functions
export const validateEmail = (email: string): boolean => {
  return validationPatterns.email.test(email);
};

export const validatePassword = (password: string): boolean => {
  return validationPatterns.password.test(password);
};

export const validatePhone = (phone: string): boolean => {
  return validationPatterns.phone.test(phone);
};

export const validateName = (name: string): boolean => {
  return validationPatterns.name.test(name);
};

// Password strength checker
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('At least 8 characters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('At least one lowercase letter');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('At least one uppercase letter');

  if (/\d/.test(password)) score += 1;
  else feedback.push('At least one number');

  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('At least one special character');

  return { score, feedback };
};

// Authentication functions
export const signUp = async (
  email: string,
  password: string,
  fullName?: string
): Promise<{ user: AuthUser | null; error: string | null }> => {
  try {
    if (!validateEmail(email)) {
      return { user: null, error: 'Invalid email format' };
    }

    if (!validatePassword(password)) {
      return { user: null, error: authErrors.PASSWORD_TOO_WEAK };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: userRoles.USER,
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user as AuthUser, error: null };
  } catch (error) {
    return { user: null, error: 'An unexpected error occurred' };
  }
};

export const signIn = async (
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> => {
  try {
    if (!validateEmail(email)) {
      return { user: null, error: 'Invalid email format' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: authErrors.INVALID_CREDENTIALS };
    }

    return { user: data.user as AuthUser, error: null };
  } catch (error) {
    return { user: null, error: 'An unexpected error occurred' };
  }
};

export const signOut = async (): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error?.message || null };
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
};

export const resetPassword = async (
  email: string
): Promise<{ error: string | null }> => {
  try {
    if (!validateEmail(email)) {
      return { error: 'Invalid email format' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    return { error: error?.message || null };
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
};

export const updatePassword = async (
  newPassword: string
): Promise<{ error: string | null }> => {
  try {
    if (!validatePassword(newPassword)) {
      return { error: authErrors.PASSWORD_TOO_WEAK };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error: error?.message || null };
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
};

// OAuth authentication
export const signInWithOAuth = async (
  provider: 'google' | 'apple' | 'github'
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error: error?.message || null };
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
};

// User profile management
export const getUserProfile = async (userId: string): Promise<{
  profile: UserProfile | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { profile: null, error: error.message };
    }

    return { profile: data as UserProfile, error: null };
  } catch (error) {
    return { profile: null, error: 'An unexpected error occurred' };
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ profile: UserProfile | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { profile: null, error: error.message };
    }

    return { profile: data as UserProfile, error: null };
  } catch (error) {
    return { profile: null, error: 'An unexpected error occurred' };
  }
};

// Authorization functions
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
};

export const isAdmin = (user: AuthUser | null): boolean => {
  return user?.user_metadata?.role === userRoles.ADMIN;
};

export const canAccessRoute = (path: string, userRole?: UserRole): boolean => {
  // Check if route is public
  if (authRoutes.public.some(route => path.startsWith(route))) {
    return true;
  }

  // Check if route requires authentication
  if (authRoutes.protected.some(route => path.startsWith(route))) {
    return !!userRole;
  }

  // Check if route requires admin access
  if (authRoutes.admin.some(route => path.startsWith(route))) {
    return userRole === userRoles.ADMIN;
  }

  // Default to requiring authentication
  return !!userRole;
};

// Session management (client-side)
export const refreshSession = async (): Promise<{
  session: Session | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return { session: null, error: error.message };
    }

    return { session: data.session, error: null };
  } catch (error) {
    return { session: null, error: 'An unexpected error occurred' };
  }
};

// Email verification
export const resendConfirmation = async (
  email: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    return { error: error?.message || null };
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
};

// Utility to format auth errors for display
export const formatAuthError = (error: string): string => {
  // Map common Supabase errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'Invalid login credentials': authErrors.INVALID_CREDENTIALS,
    'Email not confirmed': authErrors.EMAIL_NOT_CONFIRMED,
    'User already registered': authErrors.EMAIL_ALREADY_EXISTS,
    'Password should be at least 6 characters': authErrors.PASSWORD_TOO_WEAK,
  };

  return errorMap[error] || error;
};