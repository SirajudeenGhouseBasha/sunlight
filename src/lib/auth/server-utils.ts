/**
 * Server-Side Authentication Utilities
 * 
 * Server-only authentication functions
 * Requirements: 3.1, 3.2, 3.3 - Authentication integration and user management
 */

import { Session } from '@supabase/supabase-js';
import { createClient } from '@/src/lib/supabase/server';
import { AuthUser } from './utils';

// Server-side authentication utilities
export const getServerUser = async (): Promise<{
  user: AuthUser | null;
  error: string | null;
}> => {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: user as AuthUser, error: null };
  } catch (error) {
    return { user: null, error: 'An unexpected error occurred' };
  }
};

export const getServerSession = async (): Promise<{
  session: Session | null;
  error: string | null;
}> => {
  try {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return { session: null, error: error.message };
    }

    return { session, error: null };
  } catch (error) {
    return { session: null, error: 'An unexpected error occurred' };
  }
};
