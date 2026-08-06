-- Allow guest orders
--
-- 1. Make orders.user_id nullable — guest orders have user_id set to an
--    anonymous auth user created server-side, but keeping it nullable gives
--    future flexibility.
-- 2. Make order_items.variant_id nullable — decoupled predesigned products
--    (predesigned_products table, no variants) don't have a variant_id.

ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE order_items ALTER COLUMN variant_id DROP NOT NULL;

-- RLS: allow the service role to insert guest orders (bypasses RLS by default,
-- but explicit policies make intent clear for future audits).
CREATE POLICY "Allow guest order insert" ON orders
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
