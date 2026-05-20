/**
 * Seed Production Data Script
 *
 * Creates sample production orders for testing the workflow system.
 * Run with: npx tsx scripts/seed-production-data.ts
 *
 * Requirements: 18.1, 18.2, 18.3
 */

import { createClient } from '@supabase/supabase-js';
import { ProductionState } from '../src/types/production';

// =============================================
// CONFIG
// =============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =============================================
// SEED DATA
// =============================================

const SAMPLE_ORDERS = [
  {
    state: ProductionState.ORDER_RECEIVED,
    priority: 50,
    product_type: 'predesigned' as const,
    error_message: null,
  },
  {
    state: ProductionState.DESIGN_VALIDATED,
    priority: 75,
    product_type: 'custom' as const,
    error_message: null,
  },
  {
    state: ProductionState.PRINT_QUEUE,
    priority: 90,
    product_type: 'predesigned' as const,
    error_message: null,
  },
  {
    state: ProductionState.PRINTING,
    priority: 60,
    product_type: 'custom' as const,
    error_message: null,
  },
  {
    state: ProductionState.PRINT_FAILED,
    priority: 95,
    product_type: 'predesigned' as const,
    error_message: 'Print head malfunction - requires manual intervention',
    retry_count: 1,
  },
  {
    state: ProductionState.QUALITY_CHECK,
    priority: 40,
    product_type: 'custom' as const,
    error_message: null,
  },
  {
    state: ProductionState.PACKAGING,
    priority: 30,
    product_type: 'predesigned' as const,
    error_message: null,
  },
  {
    state: ProductionState.READY_TO_SHIP,
    priority: 20,
    product_type: 'custom' as const,
    error_message: null,
  },
];

// =============================================
// HELPERS
// =============================================

function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

function generateItemId(): string {
  return `ITM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

function createStateHistory(currentState: ProductionState) {
  const states = [
    ProductionState.ORDER_RECEIVED,
    ProductionState.DESIGN_VALIDATED,
    ProductionState.PRINT_QUEUE,
    ProductionState.PRINTING,
    ProductionState.PRINT_COMPLETED,
    ProductionState.QUALITY_CHECK,
    ProductionState.QUALITY_PASSED,
    ProductionState.PACKAGING,
    ProductionState.READY_TO_SHIP,
    ProductionState.SHIPPED,
  ];

  const currentIndex = states.indexOf(currentState);
  const history = [];
  const now = new Date();

  for (let i = 0; i <= currentIndex; i++) {
    const transitionTime = new Date(now.getTime() - (currentIndex - i) * 60 * 60 * 1000); // 1 hour between transitions
    history.push({
      from_state: i === 0 ? null : states[i - 1],
      to_state: states[i],
      transitioned_at: transitionTime.toISOString(),
      metadata: {
        triggered_by: i === 0 ? 'order-creation' : 'automated-workflow',
        reason: i === 0 ? 'Order created' : `Transitioned to ${states[i]}`,
      },
    });
  }

  return history;
}

// =============================================
// MAIN
// =============================================

async function main() {
  console.log('🌱 Seeding production data...');

  try {
    // First, get some existing orders and variants to link to
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .limit(5);

    const { data: variants } = await supabase
      .from('variants')
      .select('id')
      .limit(5);

    const { data: designs } = await supabase
      .from('designs')
      .select('id')
      .limit(3);

    if (!orders?.length || !variants?.length) {
      console.warn('⚠️  No existing orders or variants found. Creating minimal test data...');
      
      // Create a test order if none exist
      const { data: testOrder } = await supabase
        .from('orders')
        .insert({
          order_number: 'TEST-001',
          user_id: '00000000-0000-0000-0000-000000000000', // placeholder
          status: 'confirmed',
          total_amount: 29.99,
          shipping_address_id: 'test-address',
        })
        .select('id')
        .single();

      if (testOrder) {
        orders?.push(testOrder);
      }
    }

    const createdOrders = [];

    for (let i = 0; i < SAMPLE_ORDERS.length; i++) {
      const sample = SAMPLE_ORDERS[i];
      const orderId = orders?.[i % (orders?.length ?? 1)]?.id ?? generateOrderId();
      const variantId = variants?.[i % (variants?.length ?? 1)]?.id ?? null;
      const designId = sample.product_type === 'predesigned' 
        ? (designs?.[i % (designs?.length ?? 1)]?.id ?? null)
        : null;

      const productionOrder = {
        order_id: orderId,
        order_item_id: generateItemId(),
        variant_id: variantId,
        product_type: sample.product_type,
        design_id: designId,
        customization_data: sample.product_type === 'custom' ? {
          layers: [
            { type: 'text', content: `Custom Design ${i + 1}`, x: 50, y: 50 },
            { type: 'image', url: 'https://example.com/custom-image.png', x: 100, y: 100 },
          ],
        } : null,
        print_file_url: [ProductionState.PRINT_QUEUE, ProductionState.PRINTING, ProductionState.PRINT_COMPLETED].includes(sample.state)
          ? `https://storage.example.com/print-files/order-${i + 1}.pdf`
          : null,
        current_state: sample.state,
        state_history: createStateHistory(sample.state),
        priority: sample.priority,
        retry_count: sample.retry_count ?? 0,
        max_retries: 3,
        error_message: sample.error_message,
      };

      const { data, error } = await supabase
        .from('production_orders')
        .insert(productionOrder)
        .select('id, order_id, current_state, priority')
        .single();

      if (error) {
        console.error(`❌ Failed to create production order ${i + 1}:`, error.message);
      } else {
        createdOrders.push(data);
        console.log(`✅ Created production order: ${data.id} (${data.current_state}, priority: ${data.priority})`);
      }
    }

    console.log(`\n🎉 Successfully created ${createdOrders.length}/${SAMPLE_ORDERS.length} production orders`);
    
    // Summary by state
    const stateCount = createdOrders.reduce((acc, order) => {
      acc[order.current_state] = (acc[order.current_state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Orders by state:');
    Object.entries(stateCount).forEach(([state, count]) => {
      console.log(`   ${state}: ${count}`);
    });

    console.log('\n🔗 View in admin panel: /admin → Production Orders tab');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as seedProductionData };