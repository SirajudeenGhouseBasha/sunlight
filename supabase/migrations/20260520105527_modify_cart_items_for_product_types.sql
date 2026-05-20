-- Migration: Modify cart_items table for product type discrimination
-- Task: 1.3 Modify cart_items table for product type discrimination
-- Requirements: 1.1, 1.2, 1.3, 1.4
-- 
-- This migration modifies the cart_items table to support both predesigned and custom products.
-- Written to be fully idempotent — safe to run even if earlier migrations partially applied columns.

-- =============================================
-- STEP 1: DROP EXISTING CONSTRAINTS AND INDEXES
-- =============================================

ALTER TABLE cart_items 
DROP CONSTRAINT IF EXISTS cart_items_user_id_variant_id_design_id_key;

-- Drop constraints that may already exist from earlier migrations
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS check_product_type_consistency;
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS check_cart_item_product_type;
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS check_predesigned_has_variant;
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS check_custom_has_model_and_type;

-- Drop indexes that may already exist
DROP INDEX IF EXISTS idx_cart_items_unique_predesigned;
DROP INDEX IF EXISTS idx_cart_items_unique_custom;
DROP INDEX IF EXISTS idx_cart_items_product_type_id;
DROP INDEX IF EXISTS idx_cart_items_model_id;
DROP INDEX IF EXISTS idx_cart_items_custom_products;

-- =============================================
-- STEP 2: ADD NEW COLUMNS (idempotent)
-- =============================================

ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS product_type_id UUID REFERENCES product_types(id) ON DELETE RESTRICT;

ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES models(id) ON DELETE RESTRICT;

ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS custom_design_data JSONB;

-- =============================================
-- STEP 3: MODIFY EXISTING COLUMNS
-- =============================================

ALTER TABLE cart_items ALTER COLUMN design_id DROP NOT NULL;
ALTER TABLE cart_items ALTER COLUMN variant_id DROP NOT NULL;

-- =============================================
-- STEP 4: CLEAN UP EXISTING DATA
-- =============================================

-- Remove cart items that have neither design_id nor custom_design_data
-- (orphaned rows that can't satisfy the constraint)
DELETE FROM cart_items
WHERE design_id IS NULL AND custom_design_data IS NULL;

-- Clear custom_design_data on rows that have both set
UPDATE cart_items
SET custom_design_data = NULL
WHERE design_id IS NOT NULL AND custom_design_data IS NOT NULL;

-- =============================================
-- STEP 5: ADD CHECK CONSTRAINTS
-- =============================================

ALTER TABLE cart_items 
ADD CONSTRAINT check_cart_item_product_type 
CHECK (
    (design_id IS NOT NULL AND custom_design_data IS NULL) 
    OR 
    (design_id IS NULL AND custom_design_data IS NOT NULL)
);

ALTER TABLE cart_items 
ADD CONSTRAINT check_predesigned_has_variant 
CHECK (
    design_id IS NULL 
    OR 
    (design_id IS NOT NULL AND variant_id IS NOT NULL)
);

ALTER TABLE cart_items 
ADD CONSTRAINT check_custom_has_model_and_type 
CHECK (
    custom_design_data IS NULL 
    OR 
    (custom_design_data IS NOT NULL AND model_id IS NOT NULL AND product_type_id IS NOT NULL)
);

-- =============================================
-- STEP 6: CREATE UNIQUE INDEXES
-- =============================================

CREATE UNIQUE INDEX idx_cart_items_unique_predesigned 
ON cart_items (user_id, variant_id, design_id) 
WHERE design_id IS NOT NULL;

CREATE UNIQUE INDEX idx_cart_items_unique_custom 
ON cart_items (user_id, model_id, product_type_id, md5(custom_design_data::text)) 
WHERE custom_design_data IS NOT NULL;

-- =============================================
-- STEP 7: CREATE PERFORMANCE INDEXES
-- =============================================

CREATE INDEX idx_cart_items_product_type_id ON cart_items(product_type_id) 
WHERE product_type_id IS NOT NULL;

CREATE INDEX idx_cart_items_model_id ON cart_items(model_id) 
WHERE model_id IS NOT NULL;

CREATE INDEX idx_cart_items_custom_products ON cart_items(user_id, model_id, product_type_id) 
WHERE custom_design_data IS NOT NULL;

-- =============================================
-- STEP 8: COMMENTS
-- =============================================

COMMENT ON COLUMN cart_items.product_type_id IS 'Material type for custom products (affects pricing). NULL for predesigned products.';
COMMENT ON COLUMN cart_items.model_id IS 'Phone model for custom products. NULL for predesigned products.';
COMMENT ON COLUMN cart_items.custom_design_data IS 'Custom design layers and elements (JSONB). NULL for predesigned products, NOT NULL for custom products.';
COMMENT ON COLUMN cart_items.design_id IS 'Reference to predesigned design. NULL for custom products, NOT NULL for predesigned products.';
COMMENT ON COLUMN cart_items.variant_id IS 'Reference to variant (model + product_type + color). Required for predesigned products, may be NULL for custom products.';
COMMENT ON TABLE cart_items IS 'Shopping cart items supporting both predesigned (design_id + variant_id) and custom (model_id + product_type_id + custom_design_data) products';
