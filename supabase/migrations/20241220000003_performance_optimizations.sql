-- Performance Optimization Indexes
-- This migration adds advanced indexes to support high-performance queries
-- for the product catalog, search, and user dashboard.

-- Enable pg_trgm extension for fast ILIKE search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- PRODUCT CATALOG OPTIMIZATIONS
-- =============================================

-- Optimize variants listing with pagination and active filter
-- This covers the main query pattern for the product grid
CREATE INDEX IF NOT EXISTS idx_variants_catalog_listing 
ON variants (is_active, created_at DESC) 
WHERE is_active = true;

-- Optimize category filtering (slug lookups)
-- Ensures fast routing and filtering by product type
CREATE INDEX IF NOT EXISTS idx_product_types_slug_lower 
ON product_types (LOWER(slug));

-- Optimize brand-model relationship lookups
CREATE INDEX IF NOT EXISTS idx_models_brand_active_composite 
ON models (brand_id, is_active) 
WHERE is_active = true;

-- =============================================
-- SEARCH OPTIMIZATIONS (TRIGRAM INDEXES)
-- =============================================
-- These indexes significantly speed up ILIKE '%search%' queries

-- Trigram index for variant names
CREATE INDEX IF NOT EXISTS idx_variants_name_trgm 
ON variants USING gin (name gin_trgm_ops);

-- Trigram index for model names
CREATE INDEX IF NOT EXISTS idx_models_name_trgm 
ON models USING gin (name gin_trgm_ops);

-- Trigram index for brand names
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm 
ON brands USING gin (name gin_trgm_ops);

-- Trigram index for product type names
CREATE INDEX IF NOT EXISTS idx_product_types_name_trgm 
ON product_types USING gin (name gin_trgm_ops);

-- =============================================
-- USER DASHBOARD & E-COMMERCE OPTIMIZATIONS
-- =============================================

-- Optimize user order history
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created 
ON orders (user_id, status, created_at DESC);

-- Optimize design searching and browsing
CREATE INDEX IF NOT EXISTS idx_designs_user_active_public 
ON designs (user_id, is_active, is_public);

-- Optimize cart lookups for active users
CREATE INDEX IF NOT EXISTS idx_cart_items_user_variant_design 
ON cart_items (user_id, variant_id, design_id);

-- Add comments for documentation
COMMENT ON INDEX idx_variants_catalog_listing IS 'Optimizes product catalog browsing with pagination';
COMMENT ON INDEX idx_variants_name_trgm IS 'Enables high-performance fuzzy search on variant names';
COMMENT ON INDEX idx_orders_user_status_created IS 'Optimizes order history lookups for users';
