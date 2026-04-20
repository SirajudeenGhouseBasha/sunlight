/**
 * Authentication Hook for Phone Case Platform
 * 
 * Provides React hook for authentication state management
 * Requirements: 3.1, 3.2, 3.3 - Authentication integration and user management
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { 
  AuthUser, 
  UserProfile, 
  AuthState,
  signUp,
  signIn,
  signOut,
  resetPassword,
  updatePassword,
  signInWithOAuth,
  getUserProfile,
  updateUserProfile,
  refreshSession,
  resendConfirmation,
  formatAuthError
} from '@/src/lib/auth/utils';
import { UserRole, userRoles } from '@/src/lib/auth/config';

export interface UseAuthReturn extends AuthState {
  // Authentication methods
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: 'google' | 'apple' | 'github') => Promise<{ error: string | null }>;
  
  // Password management
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  
  // Profile management
  profile: UserProfile | null;
  loadingProfile: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
  
  // Session management
  refreshSession: () => Promise<{ error: string | null }>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  
  // Utility methods
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasRole: (role: UserRole) => boolean;
  clearError: () => void;
  
  // Error state
  error: string | null;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setError(formatAuthError(sessionError.message));
        } else if (mounted) {
          setSession(session);
          setUser(session?.user as AuthUser || null);
          
          // Load user profile if authenticated
          if (session?.user) {
            await loadUserProfile(session.user.id);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setError('Failed to initialize authentication');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user as AuthUser || null);
        setError(null);

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              await loadUserProfile(session.user.id);
            }
            break;
          case 'SIGNED_OUT':
            setProfile(null);
            break;
          case 'TOKEN_REFRESHED':
            // Session refreshed successfully
            break;
          case 'USER_UPDATED':
            if (session?.user) {
              await loadUserProfile(session.user.id);
            }
            break;
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile
  const loadUserProfile = useCallback(async (userId: string) => {
    setLoadingProfile(true);
    try {
      const { profile: userProfile, error: profileError } = await getUserProfile(userId);
      
      if (profileError) {
        console.error('Error loading profile:', profileError);
        // Don't set error for profile loading failures
      } else {
        setProfile(userProfile);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // Authentication methods
  const handleSignUp = useCallback(async (
    email: string, 
    password: string, 
    fullName?: string
  ): Promise<{ error: string | null }> => {
    setLoading(true);
    setError(null);
    
    try {
      const { user: newUser, error: signUpError } = await signUp(email, password, fullName);
      
      if (signUpError) {
        const formattedError = formatAuthError(signUpError);
        setError(formattedError);
        return { error: formattedError };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during sign up';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignIn = useCallback(async (
    email: string, 
    password: string
  ): Promise<{ error: string | null }> => {
    setLoading(true);
    setError(null);
    
    try {
      const { user: signedInUser, error: signInError } = await signIn(email, password);
      
      if (signInError) {
        const formattedError = formatAuthError(signInError);
        setError(formattedError);
        return { error: formattedError };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during sign in';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async (): Promise<{ error: string | null }> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: signOutError } = await signOut();
      
      if (signOutError) {
        const formattedError = formatAuthError(signOutError);
        setError(formattedError);
        return { error: formattedError };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during sign out';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOAuthSignIn = useCallback(async (
    provider: 'google' | 'apple' | 'github'
  ): Promise<{ error: string | null }> => {
    setError(null);
    
    try {
      const { error: oauthError } = await signInWithOAuth(provider);
      
      if (oauthError) {
        const formattedError = formatAuthError(oauthError);
        setError(formattedError);
        return { error: formattedError };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during OAuth sign in';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, []);

  // Password management
  const handleResetPassword = useCallback(async (
    email: string
  ): Promise<{ error: string | null }> => {
    setError(null);
    
    try {
      const { error: resetError } = await resetPassword(email);
      
      if (resetError) {
        const formattedError = formatAuthError(resetError);
        setError(formattedError);
        return { error: formattedError };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during password reset';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, []);

  const handleUpdatePassword = useCallback(async (
    newPassword: string
  ): Promise<{ error: string | null }> => {
    setError(null);
    
    try {
      const { error: updateError } = await updatePassword(newPassword);
      
      if (updateError) {
        const formattedError = formatAuthError(updateError);
        setError(formattedError);
        return { error: formattedError };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during password update';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, []);

  // Profile management
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadUserProfile(user.id);
    }
  }, [user?.id, loadUserProfile]);

  const handleUpdateProfile = useCallback(async (
    updates: Partial<UserProfile>
  ): Promise<{ error: string | null }> => {
    if (!user?.id) {
      return { error: 'User not authenticated' };
    }

    setLoadingProfile(true);
    setError(null);
    
    try {
      const { profile: updatedProfile, error: updateError } = await updateUserProfile(user.id, updates);
      
      if (updateError) {
        const formattedError = formatAuthError(updateError);
        setError(formattedError);
        return { error: formattedError };
      }

      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      return { error: null };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during profile update';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoadingProfile(false);
    }
  }, [user?.id]);

  // Session management
  const handleRefreshSession = useCallback(async (): Promise<{ error: string | null }> => {
    setError(null);
    
    try {
      const { session: refreshedSession, error: refreshError } = await refreshSession();
      
      if (refreshError) {
        const formattedError = formatAuthError(refreshError);
        setError(formattedError);
        return { error: formattedError };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during session refresh';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, []);

  const handleResendConfirmation = useCallback(async (
    email: string
  ): Promise<{ error: string | null }> => {
    setError(null);
    
    try {
      const { error: resendError } = await resendConfirmation(email);
      
      if (resendError) {
        const formattedError = formatAuthError(resendError);
        setError(formattedError);
        return { error: formattedError };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while resending confirmation';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, []);

  // Utility methods
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isAuthenticated = !!user && !!session;
  const isAdminUser = user?.user_metadata?.role === userRoles.ADMIN;
  
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.user_metadata?.role === role;
  }, [user?.user_metadata?.role]);

  return {
    // State
    user,
    session,
    loading,
    error,
    profile,
    loadingProfile,
    
    // Authentication methods
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    signInWithOAuth: handleOAuthSignIn,
    
    // Password management
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
    
    // Profile management
    refreshProfile,
    updateProfile: handleUpdateProfile,
    
    // Session management
    refreshSession: handleRefreshSession,
    resendConfirmation: handleResendConfirmation,
    
    // Utility methods
    isAuthenticated,
    isAdmin: isAdminUser,
    hasRole,
    clearError,
  };
};