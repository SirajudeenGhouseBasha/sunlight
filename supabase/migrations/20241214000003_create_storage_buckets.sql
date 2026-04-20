-- Storage Buckets and Policies for Image Handling
-- This migration creates storage buckets for user uploads and templates
-- Requirements: 4.1, 4.2, 4.3 - Image storage and validation

-- =============================================
-- CREATE STORAGE BUCKETS
-- =============================================

-- Bucket for user-uploaded designs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'designs',
  'designs',
  true, -- Public bucket for serving images
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket for admin-managed templates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'templates',
  'templates',
  true, -- Public bucket for serving template images
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket for optimized thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true, -- Public bucket for serving thumbnails
  2097152, -- 2MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES FOR DESIGNS BUCKET
-- =============================================

-- Allow authenticated users to upload their own designs
CREATE POLICY "Users can upload their own designs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'designs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own designs
CREATE POLICY "Users can read their own designs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'designs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to public designs
CREATE POLICY "Public designs are readable by everyone"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'designs' AND
  EXISTS (
    SELECT 1 FROM designs
    WHERE designs.image_url LIKE '%' || name || '%'
    AND designs.is_public = true
  )
);

-- Allow users to update their own designs
CREATE POLICY "Users can update their own designs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'designs' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'designs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own designs
CREATE POLICY "Users can delete their own designs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'designs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- STORAGE POLICIES FOR TEMPLATES BUCKET
-- =============================================

-- Allow admins to upload templates
CREATE POLICY "Admins can upload templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'templates' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow everyone to read templates
CREATE POLICY "Templates are readable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'templates');

-- Allow admins to update templates
CREATE POLICY "Admins can update templates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'templates' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'templates' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow admins to delete templates
CREATE POLICY "Admins can delete templates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'templates' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- =============================================
-- STORAGE POLICIES FOR THUMBNAILS BUCKET
-- =============================================

-- Allow authenticated users to upload thumbnails
CREATE POLICY "Users can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow everyone to read thumbnails
CREATE POLICY "Thumbnails are readable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

-- Allow users to update their own thumbnails
CREATE POLICY "Users can update their own thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own thumbnails
CREATE POLICY "Users can delete their own thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- HELPER FUNCTIONS FOR IMAGE VALIDATION
-- =============================================

-- Function to validate image dimensions
CREATE OR REPLACE FUNCTION validate_image_dimensions(
  width INTEGER,
  height INTEGER,
  min_width INTEGER DEFAULT 500,
  min_height INTEGER DEFAULT 500,
  max_width INTEGER DEFAULT 5000,
  max_height INTEGER DEFAULT 5000
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN width >= min_width 
    AND width <= max_width 
    AND height >= min_height 
    AND height <= max_height;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate image file size
CREATE OR REPLACE FUNCTION validate_image_file_size(
  file_size INTEGER,
  max_size INTEGER DEFAULT 10485760 -- 10MB default
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN file_size > 0 AND file_size <= max_size;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get storage URL for a design
CREATE OR REPLACE FUNCTION get_design_storage_url(
  bucket_name TEXT,
  file_path TEXT
)
RETURNS TEXT AS $$
DECLARE
  base_url TEXT;
BEGIN
  -- Get the Supabase project URL from environment
  base_url := current_setting('app.settings.supabase_url', true);
  
  IF base_url IS NULL THEN
    base_url := 'http://localhost:54321'; -- Fallback for local development
  END IF;
  
  RETURN base_url || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION validate_image_dimensions IS 
  'Validates that image dimensions are within acceptable ranges';

COMMENT ON FUNCTION validate_image_file_size IS 
  'Validates that image file size is within acceptable limits';

COMMENT ON FUNCTION get_design_storage_url IS 
  'Generates the full public URL for a design image in storage';

