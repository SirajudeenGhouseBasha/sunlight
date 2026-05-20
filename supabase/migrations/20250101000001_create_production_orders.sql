-- Production Orders Table Migration
-- This migration creates the production_orders table with state machine support
-- for managing the manufacturing workflow of both predesigned and custom phone cases
-- Requirements: 4.1, 4.2, 4.8, 10.5

-- =============================================
-- PRODUCTION STATE ENUM
-- =============================================
-- Defines all possible states in the production workflow state machine
CREATE TYPE production_state AS ENUM (
    'ORDER_RECEIVED',
    'DESIGN_VALIDATED',
    'PRINT_QUEUE',
    'PRINTING',
    'PRINT_COMPLETED',
    'PRINT_FAILED',
    'QUALITY_CHECK',
    'QUALITY_PASSED',
    'QUALITY_FAILED',
    'PACKAGING',
    'READY_TO_SHIP',
    'SHIPPED',
    'CANCELLED'
);

-- =============================================
-- PRODUCTION_ORDERS TABLE
-- =============================================
-- Tracks the manufacturing state of each order item through the production workflow
-- Supports both predesigned (inventory-based) and custom (made-to-order) products
CREATE TABLE production_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Order references
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
    
    -- Product references
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
    product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('predesigned', 'custom')),
    design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
    
    -- Custom design data (for custom products)
    customization_data JSONB,
    
    -- Print file URL (required before entering print queue)
    print_file_url TEXT,
    
    -- State machine tracking
    current_state production_state NOT NULL DEFAULT 'ORDER_RECEIVED',
    state_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Priority and retry management
    priority INTEGER NOT NULL DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
    retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    max_retries INTEGER NOT NULL DEFAULT 3 CHECK (max_retries > 0),
    
    -- Error tracking
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shipped_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one production order per order item
    UNIQUE(order_item_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================

-- Index on order_id for querying production orders by order
CREATE INDEX idx_production_orders_order_id ON production_orders(order_id);

-- Index on order_item_id for quick lookup of production order by order item
CREATE INDEX idx_production_orders_order_item_id ON production_orders(order_item_id);

-- Index on current_state for filtering by workflow state
CREATE INDEX idx_production_orders_current_state ON production_orders(current_state);

-- Composite index on current_state and priority for print queue processing
-- Orders by priority DESC, created_at ASC for efficient queue retrieval
CREATE INDEX idx_production_orders_queue ON production_orders(current_state, priority DESC, created_at ASC)
    WHERE current_state = 'PRINT_QUEUE';

-- Index on priority for priority-based sorting
CREATE INDEX idx_production_orders_priority ON production_orders(priority DESC);

-- Index on created_at for chronological queries
CREATE INDEX idx_production_orders_created_at ON production_orders(created_at DESC);

-- Composite index for operational dashboards filtering by state and date
CREATE INDEX idx_production_orders_state_created ON production_orders(current_state, created_at DESC);

-- =============================================
-- TRIGGER FOR UPDATED_AT TIMESTAMP
-- =============================================

-- Create trigger to automatically update updated_at timestamp on row updates
CREATE TRIGGER update_production_orders_updated_at 
    BEFORE UPDATE ON production_orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE production_orders IS 'Tracks manufacturing workflow state for order items through production pipeline';
COMMENT ON COLUMN production_orders.order_id IS 'Reference to parent order';
COMMENT ON COLUMN production_orders.order_item_id IS 'Reference to specific order item being produced';
COMMENT ON COLUMN production_orders.variant_id IS 'Reference to product variant (model + product_type + color)';
COMMENT ON COLUMN production_orders.product_type IS 'Discriminator: predesigned (inventory) or custom (made-to-order)';
COMMENT ON COLUMN production_orders.design_id IS 'Reference to design (for predesigned products)';
COMMENT ON COLUMN production_orders.customization_data IS 'Custom design layers and elements (for custom products)';
COMMENT ON COLUMN production_orders.print_file_url IS 'URL to print-ready file (required before PRINT_QUEUE state)';
COMMENT ON COLUMN production_orders.current_state IS 'Current state in production workflow state machine';
COMMENT ON COLUMN production_orders.state_history IS 'Array of state transitions with timestamps and metadata';
COMMENT ON COLUMN production_orders.priority IS 'Priority level (0-100) for queue processing, higher = more urgent';
COMMENT ON COLUMN production_orders.retry_count IS 'Number of retry attempts for failed operations';
COMMENT ON COLUMN production_orders.max_retries IS 'Maximum retry attempts before cancellation';
COMMENT ON COLUMN production_orders.error_message IS 'Error details from failed operations';
COMMENT ON COLUMN production_orders.shipped_at IS 'Timestamp when order was shipped (set on SHIPPED state)';
