-- Phone Case Platform Database Schema
-- This migration creates the core database schema for the phone case upload platform
-- Supporting 550+ phone models, custom designs, variants, and e-commerce functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types for better type safety
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'printing', 'shipping', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- =============================================
-- BRANDS TABLE
-- =============================================
-- Stores smartphone manufacturers (Apple, Samsung, OnePlus, etc.)
-- Requirements: 1.2 - Brand name validation and uniqueness
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_brands_name ON brands(name);
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_active ON brands(is_active) WHERE is_active = true;

-- =============================================
-- MODELS TABLE  
-- =============================================
-- Stores specific smartphone models within brands
-- Requirements: 1.3 - Model-brand association integrity
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    model_number VARCHAR(100),
    release_year INTEGER,
    screen_size DECIMAL(3,1),
    dimensions JSONB, -- {width: number, height: number, depth: number}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique model names within each brand
    UNIQUE(brand_id, name),
    UNIQUE(brand_id, slug)
);

-- Create indexes for performance optimization
CREATE INDEX idx_models_brand_id ON models(brand_id);
CREATE INDEX idx_models_name ON models(name);
CREATE INDEX idx_models_slug ON models(slug);
CREATE INDEX idx_models_active ON models(is_active) WHERE is_active = true;
CREATE INDEX idx_models_brand_active ON models(brand_id, is_active) WHERE is_active = true;

-- =============================================
-- PRODUCT_TYPES TABLE
-- =============================================
-- Stores case material types (Silicone, Glass, Clear, etc.)
CREATE TABLE product_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    material_properties JSONB, -- {durability: string, flexibility: string, etc.}
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_product_types_name ON product_types(name);
CREATE INDEX idx_product_types_slug ON product_types(slug);
CREATE INDEX idx_product_types_active ON product_types(is_active) WHERE is_active = true;

-- =============================================
-- VARIANTS TABLE
-- =============================================
-- Stores product variants (colors, materials) for specific model-product_type combinations
-- Requirements: 2.4 - Product variant association with models and product types
CREATE TABLE variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    product_type_id UUID NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "Black Silicone", "Clear Glass"
    color_name VARCHAR(50) NOT NULL,
    color_hex VARCHAR(7), -- Hex color code
    price_modifier DECIMAL(10,2) DEFAULT 0.00, -- Additional cost for this variant
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique variants per model-product_type combination
    UNIQUE(model_id, product_type_id, color_name)
);

-- Create indexes for performance optimization
CREATE INDEX idx_variants_model_id ON variants(model_id);
CREATE INDEX idx_variants_product_type_id ON variants(product_type_id);
CREATE INDEX idx_variants_active ON variants(is_active) WHERE is_active = true;
CREATE INDEX idx_variants_model_product_active ON variants(model_id, product_type_id, is_active) WHERE is_active = true;

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
-- Additional user profile information beyond Supabase auth
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    role user_role DEFAULT 'user',
    shipping_address JSONB, -- {street, city, state, country, postal_code}
    billing_address JSONB,  -- {street, city, state, country, postal_code}
    preferences JSONB, -- User preferences and settings
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- =============================================
-- DESIGNS TABLE
-- =============================================
-- Stores user-uploaded designs and admin templates
CREATE TABLE designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    is_template BOOLEAN DEFAULT false, -- Admin-managed templates
    is_public BOOLEAN DEFAULT false,   -- User can share their designs
    category VARCHAR(100), -- For templates: "abstract", "nature", "geometric", etc.
    tags TEXT[], -- Array of tags for searchability
    usage_count INTEGER DEFAULT 0, -- Track popularity
    file_size INTEGER, -- In bytes
    dimensions JSONB, -- {width: number, height: number}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_designs_user_id ON designs(user_id);
CREATE INDEX idx_designs_template ON designs(is_template) WHERE is_template = true;
CREATE INDEX idx_designs_public ON designs(is_public) WHERE is_public = true;
CREATE INDEX idx_designs_category ON designs(category) WHERE category IS NOT NULL;
CREATE INDEX idx_designs_active ON designs(is_active) WHERE is_active = true;
CREATE INDEX idx_designs_usage_count ON designs(usage_count DESC);

-- =============================================
-- CART_ITEMS TABLE
-- =============================================
-- Stores shopping cart items with customization details
-- Requirements: 6.1 - Cart storage with customization details
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    customization_options JSONB, -- Additional customization details
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique cart items per user-variant-design combination
    UNIQUE(user_id, variant_id, design_id)
);

-- Create indexes for performance optimization
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_variant_id ON cart_items(variant_id);
CREATE INDEX idx_cart_items_design_id ON cart_items(design_id);

-- =============================================
-- ORDERS TABLE
-- =============================================
-- Stores order information
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) NOT NULL UNIQUE, -- Human-readable order number
    status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    
    -- Pricing breakdown
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Addresses (snapshot at time of order)
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    
    -- Payment information
    payment_method VARCHAR(50),
    payment_transaction_id VARCHAR(255),
    
    -- Fulfillment information
    tracking_number VARCHAR(100),
    estimated_delivery_date DATE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    notes TEXT,
    metadata JSONB, -- Additional order metadata
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

-- =============================================
-- ORDER_ITEMS TABLE
-- =============================================
-- Stores individual items within orders
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
    design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
    
    -- Product details (snapshot at time of order)
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255) NOT NULL,
    design_name VARCHAR(255),
    
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    customization_options JSONB, -- Snapshot of customization details
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);
CREATE INDEX idx_order_items_design_id ON order_items(design_id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at columns
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_types_updated_at BEFORE UPDATE ON product_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_designs_updated_at BEFORE UPDATE ON designs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =============================================

-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        order_num := 'PC' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(counter::TEXT, 4, '0');
        
        -- Check if this order number already exists
        IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = order_num) THEN
            RETURN order_num;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 9999 THEN
            order_num := 'PC' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || LPAD((EXTRACT(EPOCH FROM NOW())::INTEGER % 1000)::TEXT, 3, '0');
            RETURN order_num;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate cart item total price
CREATE OR REPLACE FUNCTION calculate_cart_item_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_price := NEW.unit_price * NEW.quantity;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cart item total calculation
CREATE TRIGGER calculate_cart_item_total_trigger 
    BEFORE INSERT OR UPDATE ON cart_items 
    FOR EACH ROW EXECUTE FUNCTION calculate_cart_item_total();

-- Function to calculate order item total price
CREATE OR REPLACE FUNCTION calculate_order_item_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_price := NEW.unit_price * NEW.quantity;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order item total calculation
CREATE TRIGGER calculate_order_item_total_trigger 
    BEFORE INSERT OR UPDATE ON order_items 
    FOR EACH ROW EXECUTE FUNCTION calculate_order_item_total();

-- =============================================
-- SAMPLE DATA FOR DEVELOPMENT
-- =============================================

-- Insert sample brands
INSERT INTO brands (name, slug, description) VALUES
('Apple', 'apple', 'Premium smartphones and devices'),
('Samsung', 'samsung', 'Leading Android smartphone manufacturer'),
('OnePlus', 'oneplus', 'Flagship killer smartphones'),
('Xiaomi', 'xiaomi', 'Value-focused smartphone brand'),
('Google', 'google', 'Pure Android experience smartphones');

-- Insert sample product types
INSERT INTO product_types (name, slug, description, base_price) VALUES
('Silicone', 'silicone', 'Flexible silicone case with excellent grip', 15.99),
('Clear', 'clear', 'Transparent case showing device design', 12.99),
('Glass', 'glass', 'Premium tempered glass back case', 24.99),
('Leather', 'leather', 'Premium leather case with sophisticated look', 34.99);

-- Insert sample models for Apple
INSERT INTO models (brand_id, name, slug, model_number, release_year, screen_size) 
SELECT 
    b.id,
    model_data.name,
    model_data.slug,
    model_data.model_number,
    model_data.release_year,
    model_data.screen_size
FROM brands b
CROSS JOIN (
    VALUES 
    ('iPhone 15 Pro Max', 'iphone-15-pro-max', 'A3108', 2023, 6.7),
    ('iPhone 15 Pro', 'iphone-15-pro', 'A3105', 2023, 6.1),
    ('iPhone 15 Plus', 'iphone-15-plus', 'A3093', 2023, 6.7),
    ('iPhone 15', 'iphone-15', 'A3090', 2023, 6.1),
    ('iPhone 14 Pro Max', 'iphone-14-pro-max', 'A2895', 2022, 6.7),
    ('iPhone 14 Pro', 'iphone-14-pro', 'A2892', 2022, 6.1),
    ('iPhone 14 Plus', 'iphone-14-plus', 'A2632', 2022, 6.7),
    ('iPhone 14', 'iphone-14', 'A2649', 2022, 6.1)
) AS model_data(name, slug, model_number, release_year, screen_size)
WHERE b.slug = 'apple';

-- Insert sample models for Samsung
INSERT INTO models (brand_id, name, slug, model_number, release_year, screen_size) 
SELECT 
    b.id,
    model_data.name,
    model_data.slug,
    model_data.model_number,
    model_data.release_year,
    model_data.screen_size
FROM brands b
CROSS JOIN (
    VALUES 
    ('Galaxy S24 Ultra', 'galaxy-s24-ultra', 'SM-S928', 2024, 6.8),
    ('Galaxy S24 Plus', 'galaxy-s24-plus', 'SM-S926', 2024, 6.7),
    ('Galaxy S24', 'galaxy-s24', 'SM-S921', 2024, 6.2),
    ('Galaxy S23 Ultra', 'galaxy-s23-ultra', 'SM-S918', 2023, 6.8),
    ('Galaxy S23 Plus', 'galaxy-s23-plus', 'SM-S916', 2023, 6.6),
    ('Galaxy S23', 'galaxy-s23', 'SM-S911', 2023, 6.1)
) AS model_data(name, slug, model_number, release_year, screen_size)
WHERE b.slug = 'samsung';

-- Insert sample variants for each model-product_type combination
INSERT INTO variants (model_id, product_type_id, name, color_name, color_hex, price_modifier)
SELECT 
    m.id,
    pt.id,
    pt.name || ' - ' || color_data.color_name,
    color_data.color_name,
    color_data.color_hex,
    color_data.price_modifier
FROM models m
CROSS JOIN product_types pt
CROSS JOIN (
    VALUES 
    ('Black', '#000000', 0.00),
    ('White', '#FFFFFF', 0.00),
    ('Clear', '#FFFFFF', 0.00),
    ('Blue', '#0066CC', 2.00),
    ('Red', '#CC0000', 2.00),
    ('Green', '#00CC66', 2.00)
) AS color_data(color_name, color_hex, price_modifier)
WHERE m.is_active = true AND pt.is_active = true;

-- Add comments for documentation
COMMENT ON TABLE brands IS 'Smartphone manufacturers and brands';
COMMENT ON TABLE models IS 'Specific smartphone models within brands';
COMMENT ON TABLE product_types IS 'Types of phone case materials and styles';
COMMENT ON TABLE variants IS 'Product variants combining models, types, and colors';
COMMENT ON TABLE users IS 'Extended user profiles beyond Supabase auth';
COMMENT ON TABLE designs IS 'User uploads and admin template designs';
COMMENT ON TABLE cart_items IS 'Shopping cart items with customization details';
COMMENT ON TABLE orders IS 'Customer orders and fulfillment information';
COMMENT ON TABLE order_items IS 'Individual items within customer orders';