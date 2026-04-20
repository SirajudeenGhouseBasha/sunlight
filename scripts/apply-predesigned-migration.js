/**
 * Script to apply predesigned products migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration() {
  console.log('🚀 Applying predesigned products migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241220000001_create_predesigned_products.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Size:', (migrationSQL.length / 1024).toFixed(2), 'KB\n');

    console.log('📝 SQL to execute:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('\n⚠️  Please apply this migration manually:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/bimolyuiboouvqgviztb/editor');
    console.log('2. Click "New Query"');
    console.log('3. Copy the SQL above');
    console.log('4. Paste and run it\n');
    console.log('Or use the Supabase CLI:');
    console.log('   supabase db push\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration();
