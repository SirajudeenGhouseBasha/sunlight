-- =============================================
-- DELETE ALL DATA (IMMEDIATE - NO ROLLBACK)
-- WARNING: This will permanently delete all data!
-- =============================================

-- Delete in correct order (respecting foreign keys)

-- 1. Order items (depends on orders)
DELETE FROM order_items;

-- 2. Orders (depends on users)
DELETE FROM orders;

-- 3. Cart items (depends on users and variants)
DELETE FROM cart_items;

-- 4. Designs (depends on users)
DELETE FROM designs;

-- 5. Variants (depends on models and product_types)
DELETE FROM variants;

-- 6. Product types
DELETE FROM product_types;

-- 7. Models (depends on brands)
DELETE FROM models;

-- 8. Brands
DELETE FROM brands;

-- 9. Users (OPTIONAL - uncomment to delete)
-- DELETE FROM users;

-- Show results
SELECT 'All dummy data deleted successfully!' as status;
