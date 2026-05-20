/**
 * Print Queue Service
 *
 * Manages the processing of production orders through the print queue,
 * including job dispatch, success/failure handling, and retry logic.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ProductionOrder, ProductionState } from '@/src/types/production';
import { ProductionOrderManager } from '@/src/lib/production/production-order-manager';

// =============================================
// TYPES
// =============================================

export interface PrintJobResult {
  success: boolean;
  error?: string;
  /** Estimated completion time returned by the printer, if available. */
  estimated_completion?: string;
}

export interface ProcessQueueResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ order_id: string; error: string }>;
}

// =============================================
// PRINTER STUB
// =============================================

/**
 * Stub function representing the printer integration.
 * Replace this with the actual printer API client when available.
 *
 * Requirements: 5.3
 */
export async function sendToPrinter(order: ProductionOrder): Promise<PrintJobResult> {
  // TODO: integrate with actual printer API
  // Expected contract:
  //   - POST to printer service with order.print_file_url and order metadata
  //   - Returns success + estimated_completion on acceptance
  //   - Returns success: false + error message on rejection
  console.log(`[sendToPrinter] stub called for order ${order.id}, file: ${order.print_file_url}`);

  // Stub always succeeds — real implementation will call the printer API here
  return { success: true };
}

// =============================================
// PRINT QUEUE SERVICE
// =============================================

export class PrintQueueService {
  private readonly manager: ProductionOrderManager;

  constructor(private readonly supabase: SupabaseClient) {
    this.manager = new ProductionOrderManager(supabase);
  }

  // ------------------------------------------
  // getPrintQueueItems
  // ------------------------------------------

  /**
   * Fetches all orders in PRINT_QUEUE state ordered by:
   *   1. priority DESC  (higher priority first)
   *   2. created_at ASC (older orders first within the same priority)
   *
   * Matches the composite DB index `idx_production_orders_queue`.
   *
   * Requirements: 5.1
   */
  async getPrintQueueItems(limit = 50): Promise<{
    success: boolean;
    data?: ProductionOrder[];
    error?: string;
  }> {
    return this.manager.getPrintQueue(limit);
  }

  // ------------------------------------------
  // startPrintJob
  // ------------------------------------------

  /**
   * Transitions a single order from PRINT_QUEUE → PRINTING and dispatches
   * it to the printer stub.
   *
   * Requirements: 5.2, 5.3
   */
  async startPrintJob(order: ProductionOrder): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!order.print_file_url) {
      return {
        success: false,
        error: `Order "${order.id}" has no print_file_url. Cannot start print job.`,
      };
    }

    // Transition to PRINTING
    const transition = await this.manager.transitionState(
      order.id,
      ProductionState.PRINTING,
      { triggered_by: 'print-queue-service', reason: 'Print job started' }
    );

    if (!transition.success) {
      return { success: false, error: transition.error };
    }

    return { success: true };
  }

  // ------------------------------------------
  // handlePrintSuccess
  // ------------------------------------------

  /**
   * Called when the printer confirms a job completed successfully.
   * Transitions the order from PRINTING → PRINT_COMPLETED.
   *
   * Requirements: 5.4
   */
  async handlePrintSuccess(orderId: string): Promise<{
    success: boolean;
    data?: ProductionOrder;
    error?: string;
  }> {
    return this.manager.transitionState(
      orderId,
      ProductionState.PRINT_COMPLETED,
      { triggered_by: 'print-queue-service', reason: 'Print job completed successfully' }
    );
  }

  // ------------------------------------------
  // handlePrintFailure
  // ------------------------------------------

  /**
   * Called when a print job fails. Behaviour depends on retry budget:
   *
   * - If retry_count < max_retries  → transitions PRINTING → PRINT_FAILED,
   *   then retries (PRINT_FAILED → PRINT_QUEUE) and increments retry_count.
   * - If retry_count >= max_retries → transitions to CANCELLED.
   *
   * Requirements: 5.5, 5.6
   */
  async handlePrintFailure(
    orderId: string,
    errorMessage: string
  ): Promise<{
    success: boolean;
    data?: ProductionOrder;
    error?: string;
    cancelled?: boolean;
  }> {
    // Fetch current order state
    const { data: order, error: fetchError } = await this.supabase
      .from('production_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: `Order "${orderId}" not found.` };
    }

    const current = order as ProductionOrder;

    // Step 1: transition to PRINT_FAILED, recording the error
    const failTransition = await this.manager.transitionState(
      orderId,
      ProductionState.PRINT_FAILED,
      { triggered_by: 'print-queue-service', reason: errorMessage }
    );

    if (!failTransition.success) {
      return { success: false, error: failTransition.error };
    }

    // Also persist the error_message field directly
    await this.supabase
      .from('production_orders')
      .update({ error_message: errorMessage })
      .eq('id', orderId);

    // Step 2: retry or cancel based on retry budget
    if (current.retry_count >= current.max_retries) {
      // Exhausted — cancel the order
      const cancelResult = await this.manager.cancel(
        orderId,
        `Maximum retries (${current.max_retries}) exceeded. Last error: ${errorMessage}`,
        { triggered_by: 'print-queue-service' }
      );

      return {
        success: cancelResult.success,
        data: cancelResult.data,
        error: cancelResult.error,
        cancelled: true,
      };
    }

    // Still has retries — push back to PRINT_QUEUE
    const retryResult = await this.manager.retry(orderId, {
      triggered_by: 'print-queue-service',
      reason: `Retrying after print failure: ${errorMessage}`,
    });

    return {
      success: retryResult.success,
      data: retryResult.data,
      error: retryResult.error,
      cancelled: false,
    };
  }

  // ------------------------------------------
  // processPrintQueue
  // ------------------------------------------

  /**
   * Fetches all items currently in PRINT_QUEUE and starts a print job for
   * each one sequentially. Failures on individual items are recorded but do
   * not abort processing of subsequent items.
   *
   * Requirements: 5.1, 5.2, 5.3
   */
  async processPrintQueue(limit = 50): Promise<ProcessQueueResult> {
    const result: ProcessQueueResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    const queueResult = await this.getPrintQueueItems(limit);

    if (!queueResult.success || !queueResult.data) {
      result.errors.push({
        order_id: 'queue',
        error: queueResult.error ?? 'Failed to fetch print queue.',
      });
      return result;
    }

    const items = queueResult.data;

    for (const order of items) {
      result.processed++;

      const jobResult = await this.startPrintJob(order);

      if (jobResult.success) {
        // Dispatch to printer
        const printerResult = await sendToPrinter(order);

        if (printerResult.success) {
          const successResult = await this.handlePrintSuccess(order.id);
          if (successResult.success) {
            result.succeeded++;
          } else {
            result.failed++;
            result.errors.push({
              order_id: order.id,
              error: successResult.error ?? 'Failed to record print success.',
            });
          }
        } else {
          result.failed++;
          const failureResult = await this.handlePrintFailure(
            order.id,
            printerResult.error ?? 'Unknown printer error'
          );
          if (!failureResult.success) {
            result.errors.push({
              order_id: order.id,
              error: failureResult.error ?? 'Failed to handle print failure.',
            });
          }
        }
      } else {
        result.failed++;
        result.errors.push({ order_id: order.id, error: jobResult.error ?? 'Failed to start print job.' });
      }
    }

    return result;
  }
}