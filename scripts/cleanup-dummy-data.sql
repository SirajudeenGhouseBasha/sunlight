-- =============================================
-- CLEANUP DUMMY DATA
-- This script removes all test/dummy data from the database
-- Run this carefully - it will delete data!
-- =============================================

-- Start transaction for safety
BEGIN;

-- =============================================
-- DELETE ORDER DATA (Start with dependent tables)
-- =============================================

-- Delete order items first (foreign key dependency)
DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders
);

-- Delete orders
DELETE FROM orders;

RAISE NOTICE 'Deleted all orders and order items';

-- =============================================
-- DELETE CART DATA
-- =============================================

DELETE FROM cart_items;

RAISE NOTICE 'Deleted all cart items';

-- =============================================
-- DELETE DESIGN DATA
-- =============================================

DELETE FROM designs;

RAISE NOTICE 'Deleted all designs';

-- =============================================
-- DELETE PRODUCT DATA (Variants first, then types)
-- =============================================

-- Delete variants (depends on models and product_types)
DELETE FROM variants;

RAISE NOTICE 'Deleted all variants';

-- Delete product types
DELETE FROM product_types;

RAISE NOTICE 'Deleted all product types';

-- =============================================
-- DELETE PHONE MODEL DATA
-- =============================================

-- Delete models (depends on brands)
DELETE FROM models;

RAISE NOTICE 'Deleted all phone models';

-- =============================================
-- DELETE BRAND DATA
-- =============================================

DELETE FROM brands;

RAISE NOTICE 'Deleted all brands';

-- =============================================
-- DELETE USER DATA (Keep your admin account)
-- =============================================

-- OPTION 1: Delete all users except the one you're using
-- Uncomment and replace with your user email
-- DELETE FROM users WHERE email != 'your-email@example.com';

-- OPTION 2: Delete all users (WARNING: You'll need to sign up again)
-- DELETE FROM users;

RAISE NOTICE 'User data preserved. Uncomment lines above to delete users.';

-- =============================================
-- RESET SEQUENCES (Optional - resets auto-increment counters)
-- =============================================

-- This is optional - it resets the ID counters
-- Uncomment if you want IDs to start from 1 again

-- ALTER SEQUENCE IF EXISTS brands_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS models_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS product_types_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS variants_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS designs_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS cart_items_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS order_items_id_seq RESTART WITH 1;

-- =============================================
-- COMMIT OR ROLLBACK
-- =============================================

-- Review the changes above, then:
-- COMMIT;   -- To apply the changes
-- ROLLBACK; -- To undo everything

-- For now, we'll rollback for safety
ROLLBACK;

RAISE NOTICE '==============================================';
RAISE NOTICE 'Transaction rolled back for safety.';
RAISE NOTICE 'Review the script and change ROLLBACK to COMMIT to apply changes.';
RAISE NOTICE '==============================================';
