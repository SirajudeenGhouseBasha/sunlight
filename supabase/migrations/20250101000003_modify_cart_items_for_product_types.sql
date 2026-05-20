ALTER TABLE cart_items ADD COLUMN product_type_id UUID REFERENCES product_types(id) ON DELETE RESTRICT;
ALTER TABLE cart_items ADD COLUMN model_id UUID REFERENCES models(id) ON DELETE RESTRICT;
ALTER TABLE cart_items ADD COLUMN custom_design_data JSONB;
ALTER TABLE cart_items ALTER COLUMN design_id DROP NOT NULL;
ALTER TABLE cart_items ADD CONSTRAINT check_product_type_consistency 
    CHECK (
        (design_id IS NOT NULL AND custom_design_data IS NULL) OR 
        (design_id IS NULL AND custom_design_data IS NOT NULL)
    );
