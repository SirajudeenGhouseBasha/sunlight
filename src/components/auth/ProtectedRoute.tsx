/**
 * Protected Route Component
 * 
 * Provides client-side route protection and loading states
 * Requirements: 3.4, 10.2 - Route protection and authorization
 */

'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { UserRole } from '@/src/lib/auth/config';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Redirect if not authenticated
      if (!isAuthenticated) {
        const currentPath = window.location.pathname;
        const loginUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`;
        router.push(loginUrl);
        return;
      }

      // Redirect if user doesn't have required role
      if (requiredRole && !hasRole(requiredRole)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, hasRole, requiredRole, loading, router, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show fallback if not authenticated
  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  // Show fallback if user doesn't have required role
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}

// Higher-order component for page-level protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook for conditional rendering based on authentication
export function useAuthGuard() {
  const { isAuthenticated, hasRole, isAdmin, loading } = useAuth();

  const canAccess = (requiredRole?: UserRole): boolean => {
    if (!isAuthenticated) return false;
    if (!requiredRole) return true;
    return hasRole(requiredRole);
  };

  const canAccessAdmin = (): boolean => {
    return isAuthenticated && isAdmin;
  };

  return {
    isAuthenticated,
    isAdmin,
    loading,
    canAccess,
    canAccessAdmin,
    hasRole,
  };
}