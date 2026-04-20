/**
 * Script to apply Supabase migrations programmatically
 * This bypasses the need for Supabase CLI installation
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
  console.log('\n📝 You need to add your Supabase service role key to .env.local');
  console.log('   Get it from: https://supabase.com/dashboard/project/bimolyuiboouvqgviztb/settings/api');
  console.log('   Add this line to .env.local:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here\n');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Starting migration application...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241214000001_create_phone_case_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log(`📊 Migration size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);

    // Split the SQL into individual statements
    // We need to execute them one by one for better error handling
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments
      if (statement.trim().startsWith('--')) {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct execution if RPC fails
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ sql: statement })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
        }

        successCount++;
        process.stdout.write(`✅ Statement ${i + 1}/${statements.length} executed\r`);
      } catch (err) {
        errorCount++;
        console.error(`\n❌ Error in statement ${i + 1}:`, err.message);
        console.error('Statement:', statement.substring(0, 100) + '...\n');
      }
    }

    console.log(`\n\n✨ Migration completed!`);
    console.log(`   ✅ Success: ${successCount} statements`);
    console.log(`   ❌ Errors: ${errorCount} statements\n`);

    if (errorCount === 0) {
      console.log('🎉 All migrations applied successfully!\n');
      
      // Verify tables were created
      const { data: tables, error: tablesError } = await supabase
        .from('brands')
        .select('count')
        .limit(1);

      if (!tablesError) {
        console.log('✅ Database schema verified - tables are accessible\n');
      }
    } else {
      console.log('⚠️  Some statements failed. Please check the errors above.\n');
      console.log('💡 Tip: You may need to apply the migration manually via Supabase Dashboard');
      console.log('   Go to: https://supabase.com/dashboard/project/bimolyuiboouvqgviztb/editor\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Alternative: Apply migration manually');
    console.error('   1. Go to https://supabase.com/dashboard/project/bimolyuiboouvqgviztb/editor');
    console.error('   2. Open SQL Editor');
    console.error('   3. Copy and paste the migration file content');
    console.error('   4. Run the SQL\n');
    process.exit(1);
  }
}

// Run the migration
applyMigration();
