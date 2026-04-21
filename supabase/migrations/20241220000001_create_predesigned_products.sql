-- =============================================
-- Predesigned Products Table
-- Links variants (blank cases) with design templates
-- =============================================

CREATE TABLE predesigned_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_override DECIMAL(10,2), -- Optional: override variant price
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(variant_id, design_id) -- Prevent duplicate combinations
);

-- Indexes for performance
CREATE INDEX idx_predesigned_variant ON predesigned_products(variant_id);
CREATE INDEX idx_predesigned_design ON predesigned_products(design_id);
CREATE INDEX idx_predesigned_featured ON predesigned_products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_predesigned_active ON predesigned_products(is_active) WHERE is_active = true;
CREATE INDEX idx_predesigned_display_order ON predesigned_products(display_order);

-- Update timestamp trigger
CREATE TRIGGER update_predesigned_products_updated_at
    BEFORE UPDATE ON predesigned_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE predesigned_products IS 'Links variants with design templates to create ready-to-buy predesigned cases';
COMMENT ON COLUMN predesigned_products.variant_id IS 'The base case variant (color, material, model)';
COMMENT ON COLUMN predesigned_products.design_id IS 'The design template to be printed on the case';
COMMENT ON COLUMN predesigned_products.price_override IS 'Optional custom price, otherwise uses variant price';
COMMENT ON COLUMN predesigned_products.is_featured IS 'Show on homepage featured section';
COMMENT ON COLUMN predesigned_products.display_order IS 'Sort order for display (lower = higher priority)';
