-- UPI Payment Support Migration
--
-- Adds UPI payment fields to orders table, creates a settings table for
-- UPI configuration (QR code, UPI ID, phone), and adds pending_verification
-- to the payment_status enum.
--
-- Requirements: UPI Payment integration (user story)

-- =============================================
-- ADD pending_verification TO payment_status ENUM
-- =============================================
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'pending_verification';

-- =============================================
-- ADD UPI COLUMNS TO ORDERS TABLE
-- =============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS upi_transaction_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- =============================================
-- SETTINGS TABLE for UPI configuration
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- DEFAULT UPI SETTINGS
-- =============================================
INSERT INTO settings (key, value) VALUES
('upi_config', '{
    "upi_id": "sunlightcases@upi",
    "phone": "+919999999999",
    "qr_code_url": "",
    "merchant_name": "Sunlight Cases"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_upi_transaction_id ON orders(upi_transaction_id);

-- =============================================
-- TRIGGER FOR SETTINGS UPDATED_AT
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_settings_updated_at'
    ) THEN
        CREATE TRIGGER update_settings_updated_at
            BEFORE UPDATE ON settings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON COLUMN orders.customer_name IS 'Customer name captured at checkout for UPI orders';
COMMENT ON COLUMN orders.customer_phone IS 'Customer phone number captured at checkout';
COMMENT ON COLUMN orders.customer_email IS 'Optional customer email captured at checkout';
COMMENT ON COLUMN orders.payment_screenshot_url IS 'URL to payment screenshot uploaded by customer';
COMMENT ON COLUMN orders.upi_transaction_id IS 'UPI transaction/reference ID entered by customer';
COMMENT ON COLUMN orders.verified_at IS 'Timestamp when payment was verified by admin';
COMMENT ON COLUMN orders.verified_by IS 'Admin user who verified the payment';
COMMENT ON TABLE settings IS 'Application settings key-value store with JSONB values';
