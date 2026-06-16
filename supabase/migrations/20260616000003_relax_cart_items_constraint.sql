-- Relax cart_items CHECK constraint to allow plain variants
--
-- The current constraint requires EITHER design_id OR custom_design_data.
-- This prevents adding a plain variant (no design, no custom data) to cart.
-- We relax it so that all three states are valid:
--   design_id NOT NULL  → predesigned product
--   custom_design_data NOT NULL → custom product
--   both NULL → plain variant (standalone variant, no attached design)

ALTER TABLE cart_items
DROP CONSTRAINT IF EXISTS check_cart_item_product_type;

ALTER TABLE cart_items
DROP CONSTRAINT IF EXISTS check_product_type_consistency;

ALTER TABLE cart_items
ADD CONSTRAINT check_cart_item_product_type
CHECK (
    (design_id IS NOT NULL AND custom_design_data IS NULL)
    OR
    (design_id IS NULL AND custom_design_data IS NOT NULL)
    OR
    (design_id IS NULL AND custom_design_data IS NULL)
);
