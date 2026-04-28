-- Additional latency-focused indexes for high-traffic reads
-- Targets filter + sort patterns used by API routes.

-- Variants list filtering by model/product type with active rows ordered by recency
CREATE INDEX IF NOT EXISTS idx_variants_model_active_created
ON variants (model_id, created_at DESC)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_variants_product_type_active_created
ON variants (product_type_id, created_at DESC)
WHERE is_active = true;

-- Featured/related products use active + in-stock rows ordered by recency
CREATE INDEX IF NOT EXISTS idx_variants_active_instock_created
ON variants (created_at DESC)
WHERE is_active = true AND stock_quantity > 0;

-- Fast cart retrieval for current user
CREATE INDEX IF NOT EXISTS idx_cart_items_user_created
ON cart_items (user_id, created_at DESC);

-- Templates browse and ranking
CREATE INDEX IF NOT EXISTS idx_designs_template_active_category_usage_created
ON designs (category, usage_count DESC, created_at DESC)
WHERE is_template = true AND is_active = true;
