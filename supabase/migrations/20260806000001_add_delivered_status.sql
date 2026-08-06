-- Add DELIVERED status to orders
--
-- Extends the simplified order_status enum with a final state:
--   PENDING_PAYMENT → PAID → SHIPPED → DELIVERED
-- Owner workflow action 3: Mark as delivered (after tracking number added).

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'DELIVERED';

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.delivered_at IS 'Timestamp when the order was marked as delivered';

COMMENT ON COLUMN orders.status IS 'Order status: PENDING_PAYMENT (awaiting verification), PAID (verified, awaiting shipment), SHIPPED (dispatched with tracking), DELIVERED (delivered to customer)';
