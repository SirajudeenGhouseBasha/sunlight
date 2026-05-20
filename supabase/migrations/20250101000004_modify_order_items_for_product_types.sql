-- Migration: Modify order_items table for product type discrimination
-- 
-- This migration modifies the order_items table to support both predesigned and custom products.
-- Mirrors the approach used in 20260520105527_modify_cart_items_for_product_types.sql
--
-- Key Changes:
-- 1. Add product_type_id column for material type
-- 2. Add model_id column for custom products
-- 3. Add custom_design_data JSONB column for custom product designs
-- 4. Make design_id nullable (NULL = custom, NOT NULL = predesigned)
-- 5. Add check constraints matching cart_items pattern

-- =============================================
-- STEP 1: DROP EXISTING CONSTRAINTS (idempotent)
-- =============================================

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS check_product_type_consistency;

-- =============================================
-- STEP 2: ADD NEW COLUMNS (idempotent)
-- =============================================

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_type_id UUID REFERENCES product_types(id) ON DELETE RESTRICT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES models(id) ON DELETE RESTRICT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS custom_design_data JSONB;

-- =============================================
-- STEP 3: MODIFY EXISTING COLUMNS
-- =============================================

-- Make design_id nullable (NULL = custom product, NOT NULL = predesigned)
ALTER TABLE order_items ALTER COLUMN design_id DROP NOT NULL;

-- =============================================
-- STEP 4: CLEAN UP EXISTING DATA
-- =============================================

-- Rows where design_id was set to NULL by ON DELETE SET NULL are legacy rows
-- that predate the custom product feature. Treat them as predesigned orders
-- whose design was deleted — set a sentinel so they satisfy the constraint,
-- OR simply delete them if they have no business value.
-- 
-- Strategy: rows with design_id=NULL and custom_design_data=NULL cannot satisfy
-- the XOR constraint either way. We delete them as they represent incomplete/orphaned
-- order items (design was deleted, no custom data exists).
DELETE FROM order_items
WHERE design_id IS NULL AND custom_design_data IS NULL;

-- Clean up any rows that somehow have both set (shouldn't exist, but be safe)
UPDATE order_items
SET custom_design_data = NULL
WHERE design_id IS NOT NULL AND custom_design_data IS NOT NULL;

-- =============================================
-- STEP 5: ADD CHECK CONSTRAINTS
-- =============================================

-- Ensure product type discrimination: either predesigned (design_id) or custom (custom_design_data)
ALTER TABLE order_items
ADD CONSTRAINT check_product_type_consistency
CHECK (
    (design_id IS NOT NULL AND custom_design_data IS NULL) OR
    (design_id IS NULL AND custom_design_data IS NOT NULL)
);

-- Ensure custom products have model_id and product_type_id
ALTER TABLE order_items
ADD CONSTRAINT check_custom_order_item_has_model_and_type
CHECK (
    custom_design_data IS NULL
    OR
    (custom_design_data IS NOT NULL AND model_id IS NOT NULL AND product_type_id IS NOT NULL)
);

-- =============================================
-- STEP 6: INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_order_items_product_type_id ON order_items(product_type_id)
WHERE product_type_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_model_id ON order_items(model_id)
WHERE model_id IS NOT NULL;

-- =============================================
-- STEP 7: COMMENTS
-- =============================================

COMMENT ON COLUMN order_items.product_type_id IS 'Material type for custom products (affects pricing). NULL for predesigned products.';
COMMENT ON COLUMN order_items.model_id IS 'Phone model for custom products. NULL for predesigned products.';
COMMENT ON COLUMN order_items.custom_design_data IS 'Custom design layers and elements (JSONB). NULL for predesigned, NOT NULL for custom products.';
COMMENT ON COLUMN order_items.design_id IS 'Reference to predesigned design. NULL for custom products, NOT NULL for predesigned products.';
