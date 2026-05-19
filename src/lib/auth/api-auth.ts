/**
 * API Authentication Utilities
 * 
 * Provides authentication helpers for API routes
 * (Cannot use redirect() in API routes, so we return responses instead)
 */

import { NextResponse } from 'next/server';
import { validateSession } from '@/src/lib/auth/session';

export interface AdminAccessResult {
  isValid: boolean;
  user?: any;
  response?: NextResponse;
}

/**
 * Validate admin access for API routes
 * Returns error response if not authenticated or not admin
 */
export async function validateAdminAccess(): Promise<AdminAccessResult> {
  const { user, error } = await validateSession();
  
  if (!user || error) {
    return {
      isValid: false,
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }
  
  if (user.role !== 'admin') {
    return {
      isValid: false,
      response: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ),
    };
  }
  
  return {
    isValid: true,
    user,
  };
}
