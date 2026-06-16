-- Simplify Order Status Migration
--
-- Replaces the complex order_status enum with three simplified statuses:
--   PENDING_PAYMENT - Order placed, awaiting payment verification
--   PAID            - Payment verified, awaiting shipment
--   SHIPPED         - Shipped with tracking number
--
-- This aligns with the "two actions only" owner workflow:
--   1. Verify payment → PENDING_PAYMENT → PAID
--   2. Add tracking   → PAID → SHIPPED

-- =============================================
-- STEP 1: Drop default and convert to text
-- =============================================
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;

ALTER TABLE orders ALTER COLUMN status TYPE text;

-- =============================================
-- STEP 2: Drop old enum type
-- =============================================
DROP TYPE IF EXISTS order_status;

-- =============================================
-- STEP 3: Create new simplified enum
-- =============================================
CREATE TYPE order_status AS ENUM ('PENDING_PAYMENT', 'PAID', 'SHIPPED');

-- =============================================
-- STEP 4: Migrate existing data
-- =============================================
-- Map old statuses to new simplified ones:
--   pending  → PENDING_PAYMENT
--   processing, printing → PAID
--   shipping, delivered  → SHIPPED
--   cancelled → PENDING_PAYMENT (default; owner re-evaluates)
UPDATE orders SET status = 'PENDING_PAYMENT' WHERE status IN ('pending', 'cancelled');
UPDATE orders SET status = 'PAID' WHERE status IN ('processing', 'printing');
UPDATE orders SET status = 'SHIPPED' WHERE status IN ('shipping', 'delivered');

-- =============================================
-- STEP 5: Cast column to new enum
-- =============================================
ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status;

-- =============================================
-- STEP 6: Set default for new orders
-- =============================================
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'PENDING_PAYMENT';

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON COLUMN orders.status IS 'Order status: PENDING_PAYMENT (awaiting verification), PAID (verified, awaiting shipment), SHIPPED (dispatched with tracking)';
