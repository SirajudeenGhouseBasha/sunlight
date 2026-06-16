-- Relax order_items CHECK constraints to allow plain variants
--
-- Mirrors 20260616000003_relax_cart_items_constraint.sql for the order_items table.
-- Allows design_id=NULL AND custom_design_data=NULL for plain variant orders
-- (standalone variants without an attached design or custom data).

ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS check_product_type_consistency;

ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS check_custom_order_item_has_model_and_type;

ALTER TABLE order_items
ADD CONSTRAINT check_order_item_product_type
CHECK (
    (design_id IS NOT NULL AND custom_design_data IS NULL)
    OR
    (design_id IS NULL AND custom_design_data IS NOT NULL)
    OR
    (design_id IS NULL AND custom_design_data IS NULL)
);
