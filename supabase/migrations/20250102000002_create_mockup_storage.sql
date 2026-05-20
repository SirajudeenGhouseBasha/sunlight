-- Migration: Create storage bucket for mockup template images
-- Task: 1.2 Add mockup_template_url to models table (storage support)
-- 
-- This migration creates a Supabase storage bucket for storing mockup template images
-- that will be uploaded by admins through the admin panel.

-- Create storage bucket for mockup templates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'mockup-templates',
    'mockup-templates',
    true, -- Public bucket so images can be accessed without authentication
    10485760, -- 10MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
);

-- Allow authenticated users (admins) to upload mockup templates
CREATE POLICY "Admins can upload mockup templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'mockup-templates'
    AND auth.jwt() ->> 'role' = 'admin'
);

-- Allow authenticated users (admins) to update mockup templates
CREATE POLICY "Admins can update mockup templates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'mockup-templates'
    AND auth.jwt() ->> 'role' = 'admin'
);

-- Allow authenticated users (admins) to delete mockup templates
CREATE POLICY "Admins can delete mockup templates"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'mockup-templates'
    AND auth.jwt() ->> 'role' = 'admin'
);

-- Allow public read access to mockup templates (for customer design editor)
CREATE POLICY "Public can view mockup templates"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mockup-templates');

-- Note: COMMENT ON TABLE storage.buckets is intentionally omitted
-- as the migration role does not own the storage.buckets table.
