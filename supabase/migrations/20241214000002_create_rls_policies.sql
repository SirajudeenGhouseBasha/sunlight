-- Row-Level Security (RLS) Policies for Phone Case Platform
-- This migration sets up comprehensive RLS policies to enforce data access controls
-- Requirements: 3.5, 10.1, 10.2 - Row-Level Security enforcement

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- =============================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user owns a record
CREATE OR REPLACE FUNCTION is_owner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- BRANDS TABLE RLS POLICIES
-- =============================================

-- Public read access for active brands (users need to see brands to select models)
CREATE POLICY "brands_select_public" ON brands
    FOR SELECT
    USING (is_active = true);

-- Admin-only write access for brands
CREATE POLICY "brands_insert_admin" ON brands
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "brands_update_admin" ON brands
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "brands_delete_admin" ON brands
    FOR DELETE
    USING (is_admin());

-- =============================================
-- MODELS TABLE RLS POLICIES
-- =============================================

-- Public read access for active models
CREATE POLICY "models_select_public" ON models
    FOR SELECT
    USING (is_active = true);

-- Admin-only write access for models
CREATE POLICY "models_insert_admin" ON models
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "models_update_admin" ON models
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "models_delete_admin" ON models
    FOR DELETE
    USING (is_admin());

-- =============================================
-- PRODUCT_TYPES TABLE RLS POLICIES
-- =============================================

-- Public read access for active product types
CREATE POLICY "product_types_select_public" ON product_types
    FOR SELECT
    USING (is_active = true);

-- Admin-only write access for product types
CREATE POLICY "product_types_insert_admin" ON product_types
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "product_types_update_admin" ON product_types
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "product_types_delete_admin" ON product_types
    FOR DELETE
    USING (is_admin());

-- =============================================
-- VARIANTS TABLE RLS POLICIES
-- =============================================

-- Public read access for active variants
CREATE POLICY "variants_select_public" ON variants
    FOR SELECT
    USING (is_active = true);

-- Admin-only write access for variants
CREATE POLICY "variants_insert_admin" ON variants
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "variants_update_admin" ON variants
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "variants_delete_admin" ON variants
    FOR DELETE
    USING (is_admin());

-- =============================================
-- USERS TABLE RLS POLICIES
-- =============================================

-- Users can read their own profile
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (is_owner(id));

-- Admins can read all user profiles
CREATE POLICY "users_select_admin" ON users
    FOR SELECT
    USING (is_admin());

-- Users can insert their own profile (during registration)
CREATE POLICY "users_insert_own" ON users
    FOR INSERT
    WITH CHECK (is_owner(id));

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (is_owner(id))
    WITH CHECK (is_owner(id) AND role = 'user'); -- Prevent role escalation

-- Admins can update any user profile
CREATE POLICY "users_update_admin" ON users
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Only admins can delete users (soft delete recommended)
CREATE POLICY "users_delete_admin" ON users
    FOR DELETE
    USING (is_admin());

-- =============================================
-- DESIGNS TABLE RLS POLICIES
-- =============================================

-- Users can read their own designs
CREATE POLICY "designs_select_own" ON designs
    FOR SELECT
    USING (is_owner(user_id));

-- Users can read public designs from other users
CREATE POLICY "designs_select_public" ON designs
    FOR SELECT
    USING (is_public = true AND is_active = true);

-- Users can read admin templates
CREATE POLICY "designs_select_templates" ON designs
    FOR SELECT
    USING (is_template = true AND is_active = true);

-- Admins can read all designs
CREATE POLICY "designs_select_admin" ON designs
    FOR SELECT
    USING (is_admin());

-- Users can insert their own designs
CREATE POLICY "designs_insert_own" ON designs
    FOR INSERT
    WITH CHECK (is_owner(user_id) AND is_template = false);

-- Admins can insert templates
CREATE POLICY "designs_insert_admin" ON designs
    FOR INSERT
    WITH CHECK (is_admin());

-- Users can update their own designs (not templates)
CREATE POLICY "designs_update_own" ON designs
    FOR UPDATE
    USING (is_owner(user_id) AND is_template = false)
    WITH CHECK (is_owner(user_id) AND is_template = false);

-- Admins can update any design
CREATE POLICY "designs_update_admin" ON designs
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Users can delete their own designs (not templates)
CREATE POLICY "designs_delete_own" ON designs
    FOR DELETE
    USING (is_owner(user_id) AND is_template = false);

-- Admins can delete any design
CREATE POLICY "designs_delete_admin" ON designs
    FOR DELETE
    USING (is_admin());

-- =============================================
-- CART_ITEMS TABLE RLS POLICIES
-- =============================================

-- Users can only access their own cart items
CREATE POLICY "cart_items_select_own" ON cart_items
    FOR SELECT
    USING (is_owner(user_id));

CREATE POLICY "cart_items_insert_own" ON cart_items
    FOR INSERT
    WITH CHECK (is_owner(user_id));

CREATE POLICY "cart_items_update_own" ON cart_items
    FOR UPDATE
    USING (is_owner(user_id))
    WITH CHECK (is_owner(user_id));

CREATE POLICY "cart_items_delete_own" ON cart_items
    FOR DELETE
    USING (is_owner(user_id));

-- Admins can access all cart items (for support purposes)
CREATE POLICY "cart_items_admin_access" ON cart_items
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- =============================================
-- ORDERS TABLE RLS POLICIES
-- =============================================

-- Users can read their own orders
CREATE POLICY "orders_select_own" ON orders
    FOR SELECT
    USING (is_owner(user_id));

-- Users can insert their own orders
CREATE POLICY "orders_insert_own" ON orders
    FOR INSERT
    WITH CHECK (is_owner(user_id));

-- Users can update their own orders (limited fields)
CREATE POLICY "orders_update_own" ON orders
    FOR UPDATE
    USING (is_owner(user_id))
    WITH CHECK (is_owner(user_id));

-- Admins can access all orders
CREATE POLICY "orders_select_admin" ON orders
    FOR SELECT
    USING (is_admin());

CREATE POLICY "orders_update_admin" ON orders
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Only admins can delete orders (should be rare)
CREATE POLICY "orders_delete_admin" ON orders
    FOR DELETE
    USING (is_admin());

-- =============================================
-- ORDER_ITEMS TABLE RLS POLICIES
-- =============================================

-- Users can read order items for their own orders
CREATE POLICY "order_items_select_own" ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND is_owner(orders.user_id)
        )
    );

-- Users can insert order items for their own orders
CREATE POLICY "order_items_insert_own" ON order_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND is_owner(orders.user_id)
        )
    );

-- Admins can access all order items
CREATE POLICY "order_items_select_admin" ON order_items
    FOR SELECT
    USING (is_admin());

CREATE POLICY "order_items_update_admin" ON order_items
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "order_items_delete_admin" ON order_items
    FOR DELETE
    USING (is_admin());

-- =============================================
-- ADDITIONAL SECURITY FUNCTIONS
-- =============================================

-- Function to validate user can access design
CREATE OR REPLACE FUNCTION can_access_design(design_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM designs d
        WHERE d.id = design_id
        AND (
            is_owner(d.user_id) OR  -- Own design
            d.is_public = true OR   -- Public design
            d.is_template = true OR -- Template
            is_admin()              -- Admin access
        )
        AND d.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate cart item ownership and design access
CREATE OR REPLACE FUNCTION validate_cart_item_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user owns the cart item
    IF NOT is_owner(NEW.user_id) THEN
        RAISE EXCEPTION 'Access denied: Cannot modify cart items for other users';
    END IF;
    
    -- Check if user can access the design (if specified)
    IF NEW.design_id IS NOT NULL AND NOT can_access_design(NEW.design_id) THEN
        RAISE EXCEPTION 'Access denied: Cannot use this design';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cart item validation
CREATE TRIGGER validate_cart_item_access_trigger
    BEFORE INSERT OR UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION validate_cart_item_access();

-- =============================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- =============================================

-- Grant basic permissions to authenticated users
GRANT SELECT ON brands TO authenticated;
GRANT SELECT ON models TO authenticated;
GRANT SELECT ON product_types TO authenticated;
GRANT SELECT ON variants TO authenticated;

-- Grant full access to own data
GRANT ALL ON users TO authenticated;
GRANT ALL ON designs TO authenticated;
GRANT ALL ON cart_items TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;

-- Grant usage on sequences (for auto-incrementing fields if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================
-- SECURITY AUDIT FUNCTIONS
-- =============================================

-- Function to log security events (for monitoring)
CREATE OR REPLACE FUNCTION log_security_event(
    event_type TEXT,
    table_name TEXT,
    record_id UUID DEFAULT NULL,
    details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- In a production environment, this would log to a security audit table
    -- For now, we'll use RAISE NOTICE for development
    RAISE NOTICE 'Security Event: % on % (ID: %, User: %, Details: %)', 
        event_type, table_name, record_id, auth.uid(), details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION is_admin() IS 'Check if current authenticated user has admin role';
COMMENT ON FUNCTION is_owner(UUID) IS 'Check if current authenticated user owns the specified record';
COMMENT ON FUNCTION can_access_design(UUID) IS 'Check if current user can access the specified design';
COMMENT ON FUNCTION log_security_event(TEXT, TEXT, UUID, JSONB) IS 'Log security events for audit purposes';