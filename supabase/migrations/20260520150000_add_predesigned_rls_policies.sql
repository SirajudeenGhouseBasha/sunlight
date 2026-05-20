-- =============================================
-- RLS Policies for predesigned_products table
-- =============================================

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE predesigned_products ENABLE ROW LEVEL SECURITY;

-- Public can read active predesigned products
CREATE POLICY "predesigned_select_public" ON predesigned_products
    FOR SELECT
    USING (is_active = true);

-- Admins can read all (including inactive)
CREATE POLICY "predesigned_select_admin" ON predesigned_products
    FOR SELECT
    USING (is_admin());

-- Admin-only insert
CREATE POLICY "predesigned_insert_admin" ON predesigned_products
    FOR INSERT
    WITH CHECK (is_admin());

-- Admin-only update
CREATE POLICY "predesigned_update_admin" ON predesigned_products
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Admin-only delete
CREATE POLICY "predesigned_delete_admin" ON predesigned_products
    FOR DELETE
    USING (is_admin());

-- Grant SELECT to authenticated and anon roles
GRANT SELECT ON predesigned_products TO authenticated;
GRANT SELECT ON predesigned_products TO anon;
GRANT INSERT, UPDATE, DELETE ON predesigned_products TO authenticated;
