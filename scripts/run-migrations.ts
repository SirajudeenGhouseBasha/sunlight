/**
 * Run pending migrations via Supabase service role key.
 * Usage: npx tsx scripts/run-migrations.ts
 * 
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const migrations: { name: string; sql: string }[] = [
  {
    name: 'add_last_login_to_users',
    sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE`,
  },
  {
    name: 'add_description_to_variants',
    sql: `ALTER TABLE variants ADD COLUMN IF NOT EXISTS description TEXT`,
  },
];

async function runMigrations() {
  console.log('Running migrations...\n');

  for (const migration of migrations) {
    process.stdout.write(`  → ${migration.name} ... `);
    try {
      // Use the Supabase SQL endpoint via fetch with service role
      const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: { apikey: SERVICE_ROLE_KEY },
      });

      // Run via supabase-js rpc if available, otherwise use direct fetch to SQL API
      const sqlRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: migration.sql }),
      });

      if (sqlRes.ok) {
        console.log('✓');
      } else {
        const text = await sqlRes.text();
        // If exec_sql doesn't exist, try the pg endpoint
        if (sqlRes.status === 404 || text.includes('does not exist')) {
          // Try direct table manipulation via supabase-js as fallback
          console.log(`⚠ exec_sql not available (${sqlRes.status})`);
          console.log(`    Run manually in Supabase SQL editor:\n    ${migration.sql}`);
        } else {
          console.log(`✗ ${text}`);
        }
      }
    } catch (err) {
      console.log(`✗ ${err}`);
    }
  }

  console.log('\nDone.');
}

runMigrations();
