-- Delivery Location Migration
--
-- Adds an optional delivery_location JSONB column to the orders table
-- for storing precise drop location (lat, lng, address) via map picker.
--
-- Format: { "lat": number, "lng": number, "address": string }

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_location JSONB;

COMMENT ON COLUMN orders.delivery_location IS 'Optional precise drop location from map picker (lat, lng, address)';
