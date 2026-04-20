-- Add RLS policy to allow service_role to insert user profiles
-- This is needed for the trigger to work properly
-- Requirements: 3.1, 3.2 - Automatic user profile creation

-- Allow service_role to insert user profiles (for trigger)
CREATE POLICY "users_insert_service_role" ON users
    FOR INSERT
    TO service_role
    WITH CHECK (true);
