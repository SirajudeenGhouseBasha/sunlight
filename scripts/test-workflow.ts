/**
 * Test Production Workflow Script
 *
 * Tests the complete production workflow by creating orders,
 * transitioning states, and validating the system behavior.
 *
 * Run with: npx tsx scripts/test-workflow.ts
 *
 * Requirements: 19.1, 19.2, 19.3, 19.4
 */

import { createClient } from '@supabase/supabase-js';
import { ProductionOrderManager } from '../src/lib/production/production-order-manager';
import { PrintQueue } from '../src/lib/production/print-queue';
import { ProductionState } from '../src/types/production';
import { validateTransition, getValidNextStates } from '../src/lib/production/state-machine';

// =============================================
// CONFIG
// =============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const manager = new ProductionOrderManager(supabase);
const printQueue = new PrintQueue(supabase);

// =============================================
// TEST CASES
// =============================================

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

function logTest(name: string, success: boolean, error?: string, duration?: number) {
  results.push({ name, success, error, duration });
  const icon = success ? '✅' : '❌';
  const time = duration ? ` (${duration}ms)` : '';
  console.log(`${icon} ${name}${time}`);
  if (error) console.log(`   Error: ${error}`);
}

// =============================================
// TESTS
// =============================================

async function testStateValidation() {
  console.log('\n🧪 Testing state validation...');
  
  const start = Date.now();
  
  // Valid transitions
  const validTests = [
    [ProductionState.ORDER_RECEIVED, ProductionState.DESIGN_VALIDATED],
    [ProductionState.DESIGN_VALIDATED, ProductionState.PRINT_QUEUE],
    [ProductionState.PRINT_QUEUE, ProductionState.PRINTING],
    [ProductionState.PRINTING, ProductionState.PRINT_COMPLETED],
    [ProductionState.PRINT_COMPLETED, ProductionState.QUALITY_CHECK],
  ];
  
  for (const [from, to] of validTests) {
    const result = validateTransition(from as ProductionState, to as ProductionState);
    logTest(
      `Valid transition: ${from} → ${to}`,
      result.is_valid,
      result.is_valid ? undefined : result.errors.join(', ')
    );
  }
  
  // Invalid transitions
  const invalidTests = [
    [ProductionState.ORDER_RECEIVED, ProductionState.PRINTING],
    [ProductionState.SHIPPED, ProductionState.PRINT_QUEUE],
    [ProductionState.CANCELLED, ProductionState.PRINTING],
  ];
  
  for (const [from, to] of invalidTests) {
    const result = validateTransition(from as ProductionState, to as ProductionState);
    logTest(
      `Invalid transition blocked: ${from} → ${to}`,
      !result.is_valid,
      result.is_valid ? 'Should have been blocked' : undefined
    );
  }
  
  logTest('State validation tests', true, undefined, Date.now() - start);
}

async function testProductionOrderCreation() {
  console.log('\n🧪 Testing production order creation...');
  
  const start = Date.now();
  
  try {
    // Get a test order and variant
    const { data: orders } = await supabase.from('orders').select('id').limit(1);
    const { data: variants } = await supabase.from('variants').select('id').limit(1);
    
    if (!orders?.length || !variants?.length) {
      logTest('Production order creation', false, 'No test orders or variants available');
      return;
    }
    
    const result = await manager.createProductionOrder({
      order_id: orders[0].id,
      order_item_id: `test-item-${Date.now()}`,
      variant_id: variants[0].id,
      product_type: 'predesigned',
      design_id: null,
      customization_data: null,
      print_file_url: null,
      priority: 50,
    });
    
    if (result.success && result.data) {
      // Clean up
      await supabase.from('production_orders').delete().eq('id', result.data.id);
      logTest('Production order creation', true, undefined, Date.now() - start);
    } else {
      logTest('Production order creation', false, result.error);
    }
  } catch (error) {
    logTest('Production order creation', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testStateTransitions() {
  console.log('\n🧪 Testing state transitions...');
  
  const start = Date.now();
  
  try {
    // Find an existing production order in ORDER_RECEIVED state
    const { data: orders } = await supabase
      .from('production_orders')
      .select('id, current_state')
      .eq('current_state', ProductionState.ORDER_RECEIVED)
      .limit(1);
    
    if (!orders?.length) {
      logTest('State transitions', false, 'No orders in ORDER_RECEIVED state for testing');
      return;
    }
    
    const orderId = orders[0].id;
    
    // Test valid transition
    const transitionResult = await manager.transitionState(
      orderId,
      ProductionState.DESIGN_VALIDATED,
      { reason: 'Test transition', triggered_by: 'test-script' }
    );
    
    if (transitionResult.success) {
      logTest('Valid state transition', true);
      
      // Test invalid transition (skip ahead)
      const invalidResult = await manager.transitionState(
        orderId,
        ProductionState.SHIPPED,
        { reason: 'Invalid test', triggered_by: 'test-script' }
      );
      
      logTest('Invalid transition blocked', !invalidResult.success);
      
      // Revert to original state for cleanup
      await manager.transitionState(
        orderId,
        ProductionState.ORDER_RECEIVED,
        { reason: 'Test cleanup', triggered_by: 'test-script' }
      );
    } else {
      logTest('State transitions', false, transitionResult.error);
    }
    
    logTest('State transition tests', true, undefined, Date.now() - start);
  } catch (error) {
    logTest('State transitions', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testPrintQueue() {
  console.log('\n🧪 Testing print queue...');
  
  const start = Date.now();
  
  try {
    // Get queue items
    const queueResult = await printQueue.getQueue(10);
    
    if (queueResult.success) {
      logTest(`Print queue fetch (${queueResult.data?.length ?? 0} items)`, true);
      
      if (queueResult.data && queueResult.data.length > 0) {
        // Test processing (dry run)
        const processResult = await printQueue.processQueue(1);
        
        if (processResult.success) {
          logTest(
            `Print queue processing (${processResult.data?.processed ?? 0} processed)`,
            true
          );
        } else {
          logTest('Print queue processing', false, processResult.error);
        }
      } else {
        logTest('Print queue processing', true, 'No items to process (expected)');
      }
    } else {
      logTest('Print queue fetch', false, queueResult.error);
    }
    
    logTest('Print queue tests', true, undefined, Date.now() - start);
  } catch (error) {
    logTest('Print queue tests', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testRetryMechanism() {
  console.log('\n🧪 Testing retry mechanism...');
  
  const start = Date.now();
  
  try {
    // Find a failed order or create one for testing
    let { data: failedOrders } = await supabase
      .from('production_orders')
      .select('id, retry_count, max_retries')
      .eq('current_state', ProductionState.PRINT_FAILED)
      .lt('retry_count', 3)
      .limit(1);
    
    if (!failedOrders?.length) {
      // Create a test failed order
      const { data: orders } = await supabase.from('orders').select('id').limit(1);
      const { data: variants } = await supabase.from('variants').select('id').limit(1);
      
      if (orders?.length && variants?.length) {
        const createResult = await manager.createProductionOrder({
          order_id: orders[0].id,
          order_item_id: `retry-test-${Date.now()}`,
          variant_id: variants[0].id,
          product_type: 'predesigned',
          design_id: null,
          customization_data: null,
          print_file_url: null,
          priority: 50,
        });
        
        if (createResult.success && createResult.data) {
          // Transition to failed state
          await manager.transitionState(createResult.data.id, ProductionState.DESIGN_VALIDATED);
          await manager.transitionState(createResult.data.id, ProductionState.PRINT_QUEUE);
          await manager.transitionState(createResult.data.id, ProductionState.PRINTING);
          await manager.transitionState(createResult.data.id, ProductionState.PRINT_FAILED, {
            reason: 'Test failure for retry mechanism',
            triggered_by: 'test-script',
          });
          
          failedOrders = [{ 
            id: createResult.data.id, 
            retry_count: 0, 
            max_retries: 3 
          }];
        }
      }
    }
    
    if (failedOrders?.length) {
      const orderId = failedOrders[0].id;
      const initialRetryCount = failedOrders[0].retry_count;
      
      // Test retry
      const retryResult = await manager.retry(orderId, {
        reason: 'Test retry',
        triggered_by: 'test-script',
      });
      
      if (retryResult.success) {
        logTest('Retry mechanism', true);
        
        // Verify retry count increased
        const { data: updated } = await supabase
          .from('production_orders')
          .select('retry_count')
          .eq('id', orderId)
          .single();
        
        if (updated && updated.retry_count === initialRetryCount + 1) {
          logTest('Retry count increment', true);
        } else {
          logTest('Retry count increment', false, 'Count not incremented correctly');
        }
        
        // Clean up test order if we created it
        if (initialRetryCount === 0) {
          await supabase.from('production_orders').delete().eq('id', orderId);
        }
      } else {
        logTest('Retry mechanism', false, retryResult.error);
      }
    } else {
      logTest('Retry mechanism', false, 'No failed orders available for testing');
    }
    
    logTest('Retry mechanism tests', true, undefined, Date.now() - start);
  } catch (error) {
    logTest('Retry mechanism tests', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

// =============================================
// MAIN
// =============================================

async function main() {
  console.log('🧪 Testing Production Workflow System\n');
  
  const overallStart = Date.now();
  
  await testStateValidation();
  await testProductionOrderCreation();
  await testStateTransitions();
  await testPrintQueue();
  await testRetryMechanism();
  
  const overallDuration = Date.now() - overallStart;
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏱️  Total time: ${overallDuration}ms`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   • ${r.name}: ${r.error}`);
    });
  }
  
  console.log(`\n${failed === 0 ? '🎉' : '⚠️'} Testing complete!`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as testWorkflow };