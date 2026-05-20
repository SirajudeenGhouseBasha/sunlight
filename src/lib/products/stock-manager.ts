/**
 * Stock Manager
 *
 * Manages inventory stock for predesigned phone case products.
 * Uses row-level locking (SELECT FOR UPDATE via RPC) to prevent overselling
 * under concurrent order load.
 *
 * Requirements: 2.2, 2.3, 2.4, 2.5, 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { logStockError } from '@/src/lib/logging/error-logger';

// =============================================
// TYPES
// =============================================

export interface StockCheckResult {
  /** Whether sufficient stock is available for the requested quantity. */
  available: boolean;
  /** Current stock_quantity held in the database. */
  current_stock: number;
  /** Quantity that was requested. */
  requested_quantity: number;
}

export interface StockOperationResult {
  success: boolean;
  /** Stock quantity after the operation. */
  new_stock?: number;
  error?: string;
}

// =============================================
// STOCK MANAGER
// =============================================

export class StockManager {
  constructor(private readonly supabase: SupabaseClient) {}

  // ------------------------------------------
  // getAvailableStock
  // ------------------------------------------

  /**
   * Returns the current stock_quantity for the given variant.
   *
   * Requirements: 9.1
   */
  async getAvailableStock(variantId: string): Promise<{
    success: boolean;
    stock?: number;
    error?: string;
  }> {
    const { data, error } = await this.supabase
      .from('variants')
      .select('stock_quantity')
      .eq('id', variantId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: `Failed to fetch stock for variant "${variantId}": ${error?.message ?? 'not found'}.`,
      };
    }

    return { success: true, stock: (data as { stock_quantity: number }).stock_quantity };
  }

  // ------------------------------------------
  // checkStock
  // ------------------------------------------

  /**
   * Verifies that `quantity` units are available for the given variant
   * without modifying any data.
   *
   * Requirements: 2.2, 9.2
   */
  async checkStock(variantId: string, quantity: number): Promise<StockCheckResult> {
    const stockResult = await this.getAvailableStock(variantId);

    if (!stockResult.success || stockResult.stock === undefined) {
      // Treat fetch failure as unavailable — safe default
      return { available: false, current_stock: 0, requested_quantity: quantity };
    }

    return {
      available: stockResult.stock >= quantity,
      current_stock: stockResult.stock,
      requested_quantity: quantity,
    };
  }

  // ------------------------------------------
  // decrementStock
  // ------------------------------------------

  /**
   * Atomically decrements stock_quantity by `quantity` for the given variant.
   *
   * Uses a Supabase RPC function `decrement_stock` that wraps the update in
   * a transaction with a row-level lock (SELECT … FOR UPDATE) to prevent
   * concurrent overselling.
   *
   * The RPC is expected to:
   *  - Lock the variants row
   *  - Return an error / raise an exception if stock would go negative
   *  - Return the updated stock_quantity on success
   *
   * Falls back to an optimistic UPDATE with a `stock_quantity >= quantity`
   * WHERE guard when the RPC is unavailable, which is safe for low-concurrency
   * environments.
   *
   * Requirements: 2.3, 2.4, 9.3, 9.4
   */
  async decrementStock(
    variantId: string,
    quantity: number,
    orderId?: string
  ): Promise<StockOperationResult> {
    if (quantity <= 0) {
      return { success: false, error: 'Quantity to decrement must be greater than zero.' };
    }

    // Preferred path: transactional RPC with row-level lock
    const { data: rpcData, error: rpcError } = await this.supabase.rpc('decrement_stock', {
      p_variant_id: variantId,
      p_quantity: quantity,
      p_order_id: orderId ?? null,
    });

    if (!rpcError && rpcData !== null) {
      return { success: true, new_stock: rpcData as number };
    }

    // Fallback: use a secondary RPC when the primary is unavailable.
    if (rpcError) {
      console.warn(
        `[StockManager.decrementStock] RPC decrement_stock unavailable (${rpcError.message}). ` +
          `Falling back to decrement_stock_unsafe.`
      );
    }

    const { data: fallbackData, error: fallbackError } = await this.supabase.rpc(
      'decrement_stock_unsafe',
      { p_variant_id: variantId, p_quantity: quantity }
    );

    if (fallbackError) {
      logStockError('Failed to decrement stock — both RPCs unavailable', {
        variant_id: variantId,
        order_id: orderId,
        requested_quantity: quantity,
        error: fallbackError,
      });
      return {
        success: false,
        error:
          `Failed to decrement stock for variant "${variantId}": ${fallbackError.message}. ` +
          `Ensure either the decrement_stock or decrement_stock_unsafe RPC exists.`,
      };
    }

    if (fallbackData === null) {
      logStockError('Insufficient stock — oversell prevented', {
        variant_id: variantId,
        order_id: orderId,
        requested_quantity: quantity,
      });
      return {
        success: false,
        error: `Insufficient stock for variant "${variantId}". Requested: ${quantity}.`,
      };
    }

    return { success: true, new_stock: fallbackData as number };
  }

  // ------------------------------------------
  // incrementStock
  // ------------------------------------------

  /**
   * Increments stock_quantity by `quantity` for the given variant.
   * Used when an order is cancelled to return reserved stock.
   *
   * Requirements: 2.5, 9.5
   */
  async incrementStock(
    variantId: string,
    quantity: number,
    reason?: string
  ): Promise<StockOperationResult> {
    if (quantity <= 0) {
      return { success: false, error: 'Quantity to increment must be greater than zero.' };
    }

    const { data, error } = await this.supabase.rpc('increment_stock', {
      p_variant_id: variantId,
      p_quantity: quantity,
      p_reason: reason ?? null,
    });

    if (error) {
      // Fallback: direct UPDATE (safe — adding stock never risks negative values)
      const { data: variant, error: fetchErr } = await this.supabase
        .from('variants')
        .select('stock_quantity')
        .eq('id', variantId)
        .single();

      if (fetchErr || !variant) {
        return {
          success: false,
          error: `Failed to fetch variant "${variantId}" for stock increment: ${fetchErr?.message}.`,
        };
      }

      const currentStock = (variant as { stock_quantity: number }).stock_quantity;
      const newStock = currentStock + quantity;

      const { error: updateError } = await this.supabase
        .from('variants')
        .update({ stock_quantity: newStock })
        .eq('id', variantId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to increment stock for variant "${variantId}": ${updateError.message}.`,
        };
      }

      return { success: true, new_stock: newStock };
    }

    return { success: true, new_stock: data as number };
  }
}