-- Add last_login column to users table
-- Tracks when a user last authenticated, used in the admin Users module

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.last_login IS 'Timestamp of the user''s most recent login';
