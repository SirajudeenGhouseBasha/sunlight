-- =============================================
-- Decouple predesigned_products from variants/designs
-- Predesigned cases are now standalone products with
-- direct brand/model/product_type references and their own images.
-- =============================================

-- 1. Make variant_id and design_id nullable (no longer required)
ALTER TABLE predesigned_products
  ALTER COLUMN variant_id DROP NOT NULL,
  ALTER COLUMN design_id DROP NOT NULL;

-- 2. Add direct product identity columns
ALTER TABLE predesigned_products
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES models(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_type_id UUID REFERENCES product_types(id) ON DELETE SET NULL;

-- 3. Add image columns
ALTER TABLE predesigned_products
  ADD COLUMN IF NOT EXISTS color_name VARCHAR(50),
  ADD COLUMN IF NOT EXISTS color_hex VARCHAR(7),
  ADD COLUMN IF NOT EXISTS design_image_url TEXT,
  ADD COLUMN IF NOT EXISTS variant_image_url TEXT,
  ADD COLUMN IF NOT EXISTS additional_image_urls TEXT[] DEFAULT '{}';

-- 4. Drop the old unique constraint that required variant+design combo
ALTER TABLE predesigned_products
  DROP CONSTRAINT IF EXISTS predesigned_products_variant_id_design_id_key;

-- 5. Add indexes for the new FK columns
CREATE INDEX IF NOT EXISTS idx_predesigned_brand ON predesigned_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_predesigned_model ON predesigned_products(model_id);
CREATE INDEX IF NOT EXISTS idx_predesigned_product_type ON predesigned_products(product_type_id);

-- Comments
COMMENT ON COLUMN predesigned_products.brand_id IS 'Direct brand reference (replaces variant->model->brand chain)';
COMMENT ON COLUMN predesigned_products.model_id IS 'Direct model reference';
COMMENT ON COLUMN predesigned_products.product_type_id IS 'Direct product type reference (e.g. Silicone, Glass, Clear)';
COMMENT ON COLUMN predesigned_products.design_image_url IS 'The printed design image URL';
COMMENT ON COLUMN predesigned_products.variant_image_url IS 'The physical case variant image URL';
COMMENT ON COLUMN predesigned_products.additional_image_urls IS 'Extra product images';
