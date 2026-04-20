/**
 * Database Cleanup Script
 * 
 * Deletes all dummy/test data from the database
 * Run with: node scripts/cleanup-database.js
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

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // 1. Delete order items
    console.log('Deleting order items...');
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (orderItemsError) throw orderItemsError;
    console.log('✅ Order items deleted\n');

    // 2. Delete orders
    console.log('Deleting orders...');
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (ordersError) throw ordersError;
    console.log('✅ Orders deleted\n');

    // 3. Delete cart items
    console.log('Deleting cart items...');
    const { error: cartError } = await supabase
      .from('cart_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (cartError) throw cartError;
    console.log('✅ Cart items deleted\n');

    // 4. Delete designs
    console.log('Deleting designs...');
    const { error: designsError } = await supabase
      .from('designs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (designsError) throw designsError;
    console.log('✅ Designs deleted\n');

    // 5. Delete variants
    console.log('Deleting variants...');
    const { error: variantsError } = await supabase
      .from('variants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (variantsError) throw variantsError;
    console.log('✅ Variants deleted\n');

    // 6. Delete product types
    console.log('Deleting product types...');
    const { error: typesError } = await supabase
      .from('product_types')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (typesError) throw typesError;
    console.log('✅ Product types deleted\n');

    // 7. Delete models
    console.log('Deleting phone models...');
    const { error: modelsError } = await supabase
      .from('models')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (modelsError) throw modelsError;
    console.log('✅ Phone models deleted\n');

    // 8. Delete brands
    console.log('Deleting brands...');
    const { error: brandsError } = await supabase
      .from('brands')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (brandsError) throw brandsError;
    console.log('✅ Brands deleted\n');

    // Note: We're NOT deleting users to preserve your account
    console.log('ℹ️  Users preserved (not deleted)\n');

    console.log('🎉 Database cleanup completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - All orders and order items deleted');
    console.log('   - All cart items deleted');
    console.log('   - All designs deleted');
    console.log('   - All products (variants) deleted');
    console.log('   - All product types deleted');
    console.log('   - All phone models deleted');
    console.log('   - All brands deleted');
    console.log('   - Users preserved ✓');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupDatabase();
