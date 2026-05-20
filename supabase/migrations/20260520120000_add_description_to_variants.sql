-- Add description column to variants table
-- This allows admins to provide a product-specific description for each variant

ALTER TABLE variants ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN variants.description IS 'Optional product description shown on the product display page';
