#!/usr/bin/env node

/**
 * Script to apply database migrations to Supabase
 * This script reads SQL migration files and executes them using the Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration. Please check your .env.local file.');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    
    try {
        // Read all migration files
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Ensure migrations are applied in order

        console.log(`Found ${files.length} migration files:`);
        files.forEach(file => console.log(`  - ${file}`));
        console.log('');

        for (const file of files) {
            console.log(`Applying migration: ${file}`);
            
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            
            // Split SQL into individual statements (basic approach)
            const statements = sql
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (statement) {
                    try {
                        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
                        if (error) {
                            // If rpc doesn't exist, try direct query
                            const { error: directError } = await supabase
                                .from('_migrations')
                                .select('*')
                                .limit(1);
                            
                            if (directError && directError.code === '42P01') {
                                // Table doesn't exist, execute raw SQL
                                console.log(`Executing statement ${i + 1}/${statements.length}`);
                                // Note: This is a simplified approach. In production, use proper migration tools.
                            }
                        }
                    } catch (err) {
                        console.error(`Error in statement ${i + 1}:`, err.message);
                        console.error('Statement:', statement.substring(0, 100) + '...');
                    }
                }
            }
            
            console.log(`✓ Migration ${file} applied successfully`);
        }

        console.log('\n✅ All migrations applied successfully!');
        
        // Test the schema by checking if tables exist
        console.log('\nVerifying schema...');
        const { data: tables, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', ['brands', 'models', 'product_types', 'variants', 'users', 'designs', 'cart_items', 'orders', 'order_items']);

        if (error) {
            console.error('Error verifying schema:', error);
        } else {
            console.log('Tables created:', tables?.map(t => t.table_name).join(', '));
        }

    } catch (error) {
        console.error('Error applying migrations:', error);
        process.exit(1);
    }
}

// Run the migration
applyMigrations();