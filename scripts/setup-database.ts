/**
 * Database setup script for Phone Case Platform
 * This script creates the database schema using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Environment configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQL statements for creating the schema
const createSchemaSQL = `
-- Phone Case Platform Database Schema
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for better type safety
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'printing', 'shipping', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
`;

const createTablesSQL = `
-- BRANDS TABLE
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MODELS TABLE  
CREATE TABLE IF NOT EXISTS models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    model_number VARCHAR(100),
    release_year INTEGER,
    screen_size DECIMAL(3,1),
    dimensions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(brand_id, name),
    UNIQUE(brand_id, slug)
);

-- PRODUCT_TYPES TABLE
CREATE TABLE IF NOT EXISTS product_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    material_properties JSONB,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VARIANTS TABLE
CREATE TABLE IF NOT EXISTS variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    product_type_id UUID NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color_name VARCHAR(50) NOT NULL,
    color_hex VARCHAR(7),
    price_modifier DECIMAL(10,2) DEFAULT 0.00,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(model_id, product_type_id, color_name)
);

-- USERS TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    role user_role DEFAULT 'user',
    shipping_address JSONB,
    billing_address JSONB,
    preferences JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DESIGNS TABLE
CREATE TABLE IF NOT EXISTS designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    category VARCHAR(100),
    tags TEXT[],
    usage_count INTEGER DEFAULT 0,
    file_size INTEGER,
    dimensions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CART_ITEMS TABLE
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    customization_options JSONB,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, variant_id, design_id)
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    payment_method VARCHAR(50),
    payment_transaction_id VARCHAR(255),
    tracking_number VARCHAR(100),
    estimated_delivery_date DATE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
    design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255) NOT NULL,
    design_name VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    customization_options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

const createIndexesSQL = `
-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_models_brand_id ON models(brand_id);
CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
CREATE INDEX IF NOT EXISTS idx_models_slug ON models(slug);
CREATE INDEX IF NOT EXISTS idx_models_active ON models(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_models_brand_active ON models(brand_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_product_types_name ON product_types(name);
CREATE INDEX IF NOT EXISTS idx_product_types_slug ON product_types(slug);
CREATE INDEX IF NOT EXISTS idx_product_types_active ON product_types(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_variants_model_id ON variants(model_id);
CREATE INDEX IF NOT EXISTS idx_variants_product_type_id ON variants(product_type_id);
CREATE INDEX IF NOT EXISTS idx_variants_active ON variants(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_variants_model_product_active ON variants(model_id, product_type_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_designs_user_id ON designs(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_template ON designs(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_designs_public ON designs(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_designs_category ON designs(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_designs_active ON designs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_designs_usage_count ON designs(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_design_id ON cart_items(design_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_design_id ON order_items(design_id);
`;

const insertSampleDataSQL = `
-- Insert sample brands
INSERT INTO brands (name, slug, description) VALUES
('Apple', 'apple', 'Premium smartphones and devices'),
('Samsung', 'samsung', 'Leading Android smartphone manufacturer'),
('OnePlus', 'oneplus', 'Flagship killer smartphones'),
('Xiaomi', 'xiaomi', 'Value-focused smartphone brand'),
('Google', 'google', 'Pure Android experience smartphones')
ON CONFLICT (name) DO NOTHING;

-- Insert sample product types
INSERT INTO product_types (name, slug, description, base_price) VALUES
('Silicone', 'silicone', 'Flexible silicone case with excellent grip', 15.99),
('Clear', 'clear', 'Transparent case showing device design', 12.99),
('Glass', 'glass', 'Premium tempered glass back case', 24.99),
('Leather', 'leather', 'Premium leather case with sophisticated look', 34.99)
ON CONFLICT (name) DO NOTHING;
`;

async function setupDatabase() {
    console.log('🚀 Setting up Phone Case Platform database schema...\n');

    try {
        // Step 1: Create extensions and types
        console.log('1. Creating extensions and custom types...');
        const { error: schemaError } = await supabase.rpc('exec_sql', { 
            sql: createSchemaSQL 
        });
        
        if (schemaError) {
            console.log('Note: Some extensions may already exist, continuing...');
        }

        // Step 2: Create tables
        console.log('2. Creating tables...');
        const { error: tablesError } = await supabase.rpc('exec_sql', { 
            sql: createTablesSQL 
        });
        
        if (tablesError) {
            console.error('Error creating tables:', tablesError);
            throw tablesError;
        }

        // Step 3: Create indexes
        console.log('3. Creating indexes for performance optimization...');
        const { error: indexesError } = await supabase.rpc('exec_sql', { 
            sql: createIndexesSQL 
        });
        
        if (indexesError) {
            console.error('Error creating indexes:', indexesError);
            throw indexesError;
        }

        // Step 4: Insert sample data
        console.log('4. Inserting sample data...');
        const { error: dataError } = await supabase.rpc('exec_sql', { 
            sql: insertSampleDataSQL 
        });
        
        if (dataError) {
            console.error('Error inserting sample data:', dataError);
            throw dataError;
        }

        // Step 5: Verify the setup
        console.log('5. Verifying database setup...');
        
        const { data: brands, error: brandsError } = await supabase
            .from('brands')
            .select('name')
            .limit(5);

        if (brandsError) {
            console.error('Error verifying brands table:', brandsError);
            throw brandsError;
        }

        const { data: productTypes, error: typesError } = await supabase
            .from('product_types')
            .select('name')
            .limit(5);

        if (typesError) {
            console.error('Error verifying product_types table:', typesError);
            throw typesError;
        }

        console.log('\n✅ Database setup completed successfully!');
        console.log('\n📊 Verification Results:');
        console.log(`   • Brands created: ${brands?.length || 0}`);
        console.log(`   • Product types created: ${productTypes?.length || 0}`);
        console.log('\n🎯 Next steps:');
        console.log('   • Set up Row-Level Security (RLS) policies');
        console.log('   • Add more sample models and variants');
        console.log('   • Configure Supabase Storage for image uploads');

    } catch (error) {
        console.error('\n❌ Database setup failed:', error);
        process.exit(1);
    }
}

// Export for use in other scripts
export { setupDatabase };

// Run if called directly
if (require.main === module) {
    setupDatabase();
}
`;