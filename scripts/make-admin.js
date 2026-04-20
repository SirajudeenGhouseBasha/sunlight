/**
 * Make User Admin Script
 * 
 * Promotes a user to admin role
 * Run with: node scripts/make-admin.js your-email@example.com
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function makeAdmin(email) {
  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/make-admin.js your-email@example.com');
    process.exit(1);
  }

  try {
    console.log(`🔍 Looking for user: ${email}\n`);

    // Find user
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !user) {
      console.error('❌ User not found with email:', email);
      console.log('\nMake sure:');
      console.log('1. You have signed up with this email');
      console.log('2. You have verified your email');
      console.log('3. The email is spelled correctly');
      process.exit(1);
    }

    console.log('✅ User found!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Active: ${user.is_active}\n`);

    if (user.role === 'admin') {
      console.log('ℹ️  User is already an admin!');
      process.exit(0);
    }

    // Update to admin
    console.log('🔄 Updating user to admin role...\n');

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update user:', updateError);
      process.exit(1);
    }

    console.log('🎉 Success! User is now an admin!\n');
    console.log('Updated user:');
    console.log(`   ID: ${updated.id}`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Role: ${updated.role} ✓`);
    console.log(`   Active: ${updated.is_active}\n`);

    console.log('You can now access admin pages:');
    console.log('   - http://localhost:3000/admin');
    console.log('   - http://localhost:3000/admin/product-types');
    console.log('   - http://localhost:3000/admin/variants');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];
makeAdmin(email);
