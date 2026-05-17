-- Add mask_image_url column to variants table
ALTER TABLE variants ADD COLUMN mask_image_url text;

-- Add comment explaining its use
COMMENT ON COLUMN variants.mask_image_url IS 'Optional URL for a transparent PNG mask overlay used in the product customization editor';
