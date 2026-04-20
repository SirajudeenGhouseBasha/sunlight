-- =============================================
-- Add Multiple Images Support to Variants
-- Migration: 20241220000002
-- =============================================

-- First, add the main image_url column if it doesn't exist
ALTER TABLE variants 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Then add additional_images column for multiple images
ALTER TABLE variants 
ADD COLUMN IF NOT EXISTS additional_images TEXT[] DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_variants_image_url ON variants(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_variants_additional_images ON variants USING GIN (additional_images);

-- Add comments for documentation
COMMENT ON COLUMN variants.image_url IS 'Primary product image URL (main case photo)';
COMMENT ON COLUMN variants.additional_images IS 'Array of additional product image URLs for gallery view (front, back, side angles, etc.)';

-- Update existing variants to have empty array instead of null
UPDATE variants 
SET additional_images = '{}' 
WHERE additional_images IS NULL;

-- Add constraint to ensure reasonable number of images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_additional_images_format' 
    AND table_name = 'variants'
  ) THEN
    ALTER TABLE variants 
    ADD CONSTRAINT check_additional_images_format 
    CHECK (
      additional_images IS NULL OR 
      array_length(additional_images, 1) IS NULL OR 
      array_length(additional_images, 1) <= 10
    );
  END IF;
END $$;

-- Add helper function to manage variant images
CREATE OR REPLACE FUNCTION add_variant_image(
  variant_uuid UUID,
  image_url TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Add image to additional_images array if not already present
  UPDATE variants 
  SET additional_images = array_append(
    COALESCE(additional_images, '{}'), 
    image_url
  )
  WHERE id = variant_uuid 
  AND NOT (image_url = ANY(COALESCE(additional_images, '{}')));
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add helper function to remove variant image
CREATE OR REPLACE FUNCTION remove_variant_image(
  variant_uuid UUID,
  image_url TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Remove image from additional_images array
  UPDATE variants 
  SET additional_images = array_remove(additional_images, image_url)
  WHERE id = variant_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add helper function to reorder variant images
CREATE OR REPLACE FUNCTION reorder_variant_images(
  variant_uuid UUID,
  new_image_order TEXT[]
) RETURNS BOOLEAN AS $$
BEGIN
  -- Replace entire additional_images array with new order
  UPDATE variants 
  SET additional_images = new_image_order
  WHERE id = variant_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add comments for helper functions
COMMENT ON FUNCTION add_variant_image(UUID, TEXT) IS 'Add an image URL to variant additional_images array';
COMMENT ON FUNCTION remove_variant_image(UUID, TEXT) IS 'Remove an image URL from variant additional_images array';
COMMENT ON FUNCTION reorder_variant_images(UUID, TEXT[]) IS 'Reorder variant images by replacing the entire array';

-- Create view for variants with image counts (useful for admin)
CREATE OR REPLACE VIEW variants_with_image_info AS
SELECT 
  v.*,
  CASE 
    WHEN v.image_url IS NOT NULL THEN 1 
    ELSE 0 
  END + COALESCE(array_length(v.additional_images, 1), 0) as total_images,
  COALESCE(array_length(v.additional_images, 1), 0) as additional_image_count,
  CASE 
    WHEN v.image_url IS NOT NULL THEN 
      ARRAY[v.image_url] || COALESCE(v.additional_images, '{}')
    ELSE 
      COALESCE(v.additional_images, '{}')
  END as all_images
FROM variants v;

COMMENT ON VIEW variants_with_image_info IS 'Variants with calculated image counts and combined image arrays';