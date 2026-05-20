/**
 * Production Order Manager
 *
 * Service layer for creating and managing production orders through their
 * lifecycle. All state mutations are validated by the state machine before
 * being persisted to Supabase.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 4.9, 4.10
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  ProductionOrder,
  ProductionState,
  ProductType,
  StateMetadata,
  StateTransition,
} from '@/src/types/production';
import {
  validateTransition,
} from '@/src/lib/production/state-machine';
import {
  logProductionError,
  logStateTransitionError,
} from '@/src/lib/logging/error-logger';

// =============================================
// TYPES
// =============================================

/** Fields required to open a new production order. */
export interface CreateProductionOrderInput {
  order_id: string;
  order_item_id: string;
  variant_id: string;
  product_type: ProductType;
  design_id?: string | null;
  customization_data?: Record<string, unknown> | null;
  print_file_url?: string | null;
  /** 0–100 queue priority; defaults to 50. */
  priority?: number;
  /** Override the default max_retries of 3. */
  max_retries?: number;
}

/** Payload returned by every manager function. */
export interface ProductionOrderResult {
  success: boolean;
  data?: ProductionOrder;
  error?: string;
}

// =============================================
// HELPERS
// =============================================

/**
 * Builds a new {@link StateTransition} entry to be appended to state_history.
 */
function buildTransitionEntry(
  fromState: ProductionState,
  toState: ProductionState,
  metadata?: StateMetadata
): StateTransition {
  return {
    from_state: fromState,
    to_state: toState,
    transitioned_at: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  };
}

// =============================================
// PRODUCTION ORDER MANAGER
// =============================================

export class ProductionOrderManager {
  constructor(private readonly supabase: SupabaseClient) {}

  // ------------------------------------------
  // createProductionOrder
  // ------------------------------------------

  /**
   * Creates a new production order in the ORDER_RECEIVED state.
   *
   * Requirements: 4.1, 4.2
   */
  async createProductionOrder(
    input: CreateProductionOrderInput
  ): Promise<ProductionOrderResult> {
    const {
      order_id,
      order_item_id,
      variant_id,
      product_type,
      design_id = null,
      customization_data = null,
      print_file_url = null,
      priority = 50,
      max_retries = 3,
    } = input;

    const initialTransition = buildTransitionEntry(
      ProductionState.ORDER_RECEIVED, // sentinel: same state, creation event
      ProductionState.ORDER_RECEIVED,
      { triggered_by: 'system', reason: 'Production order created' }
    );

    const { data, error } = await this.supabase
      .from('production_orders')
      .insert({
        order_id,
        order_item_id,
        variant_id,
        product_type,
        design_id,
        customization_data,
        print_file_url,
        current_state: ProductionState.ORDER_RECEIVED,
        state_history: [initialTransition],
        priority,
        retry_count: 0,
        max_retries,
        error_message: null,
      })
      .select('*')
      .single();

    if (error) {
      logProductionError('Failed to create production order', {
        context: { order_id, order_item_id, variant_id, db_error: error.message },
      });
      return {
        success: false,
        error: `Failed to create production order: ${error.message}`,
      };
    }

    return { success: true, data: data as ProductionOrder };
  }

  // ------------------------------------------
  // transitionState
  // ------------------------------------------

  /**
   * Moves a production order from its current state to `toState`.
   *
   * Validates the transition against the state machine before persisting.
   * Appends a {@link StateTransition} entry to state_history on success.
   *
   * Requirements: 4.4, 4.9
   */
  async transitionState(
    orderId: string,
    toState: ProductionState,
    metadata?: StateMetadata
  ): Promise<ProductionOrderResult> {
    // Fetch current order
    const { data: order, error: fetchError } = await this.supabase
      .from('production_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return {
        success: false,
        error: `Production order "${orderId}" not found.`,
      };
    }

    const current = order as ProductionOrder;

    // Validate transition
    const validation = validateTransition(current.current_state, toState);
    if (!validation.is_valid) {
      logStateTransitionError(validation.errors.join(' '), {
        production_order_id: orderId,
        from_state: current.current_state,
        to_state: toState,
      });
      return { success: false, error: validation.errors.join(' ') };
    }

    // Build updated state_history
    const newEntry = buildTransitionEntry(current.current_state, toState, metadata);
    const updatedHistory: StateTransition[] = [...current.state_history, newEntry];

    // Build update payload
    const updatePayload: Partial<ProductionOrder> & Record<string, unknown> = {
      current_state: toState,
      state_history: updatedHistory,
      error_message: null, // clear error on successful transition
    };

    if (toState === ProductionState.SHIPPED) {
      updatePayload.shipped_at = newEntry.transitioned_at;
    }

    const { data: updated, error: updateError } = await this.supabase
      .from('production_orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateError) {
      logProductionError('Failed to update production order state', {
        production_order_id: orderId,
        context: { to_state: toState, db_error: updateError.message },
      });
      return {
        success: false,
        error: `Failed to update production order: ${updateError.message}`,
      };
    }

    return { success: true, data: updated as ProductionOrder };
  }

  // ------------------------------------------
  // logStateTransition (internal helper, exposed for testing / manual use)
  // ------------------------------------------

  /**
   * Appends a state transition entry to a production order's state_history
   * without changing current_state. Use this to record supplementary audit
   * events (e.g. operator notes) on top of a real transition.
   *
   * Requirements: 4.3
   */
  async logStateTransition(
    orderId: string,
    fromState: ProductionState,
    toState: ProductionState,
    metadata?: StateMetadata
  ): Promise<ProductionOrderResult> {
    const { data: order, error: fetchError } = await this.supabase
      .from('production_orders')
      .select('state_history')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: `Production order "${orderId}" not found.` };
    }

    const entry = buildTransitionEntry(fromState, toState, metadata);
    const updatedHistory = [...(order as Pick<ProductionOrder, 'state_history'>).state_history, entry];

    const { data: updated, error: updateError } = await this.supabase
      .from('production_orders')
      .update({ state_history: updatedHistory })
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateError) {
      return { success: false, error: `Failed to log transition: ${updateError.message}` };
    }

    return { success: true, data: updated as ProductionOrder };
  }

  // ------------------------------------------
  // getByState
  // ------------------------------------------

  /**
   * Returns all production orders currently in the given `state`.
   *
   * Requirements: 4.6
   */
  async getByState(state: ProductionState): Promise<{
    success: boolean;
    data?: ProductionOrder[];
    error?: string;
  }> {
    const { data, error } = await this.supabase
      .from('production_orders')
      .select('*')
      .eq('current_state', state)
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, error: `Failed to query production orders: ${error.message}` };
    }

    return { success: true, data: (data ?? []) as ProductionOrder[] };
  }

  // ------------------------------------------
  // getPrintQueue
  // ------------------------------------------

  /**
   * Returns orders in PRINT_QUEUE ordered by priority (desc) then created_at (asc),
   * matching the composite index `idx_production_orders_queue`.
   *
   * Requirements: 4.6, 4.7
   */
  async getPrintQueue(limit = 50): Promise<{
    success: boolean;
    data?: ProductionOrder[];
    error?: string;
  }> {
    const { data, error } = await this.supabase
      .from('production_orders')
      .select('*')
      .eq('current_state', ProductionState.PRINT_QUEUE)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      return { success: false, error: `Failed to fetch print queue: ${error.message}` };
    }

    return { success: true, data: (data ?? []) as ProductionOrder[] };
  }

  // ------------------------------------------
  // retry
  // ------------------------------------------

  /**
   * Increments retry_count and transitions the order back to PRINT_QUEUE.
   * Returns an error if the order has exhausted its max_retries.
   *
   * Requirements: 4.9, 4.10
   */
  async retry(
    orderId: string,
    metadata?: StateMetadata
  ): Promise<ProductionOrderResult> {
    const { data: order, error: fetchError } = await this.supabase
      .from('production_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: `Production order "${orderId}" not found.` };
    }

    const current = order as ProductionOrder;

    if (current.retry_count >= current.max_retries) {
      return {
        success: false,
        error:
          `Order "${orderId}" has reached its maximum retry limit ` +
          `(${current.retry_count}/${current.max_retries}). Cancel or escalate manually.`,
      };
    }

    // Validate the transition (PRINT_FAILED or QUALITY_FAILED → PRINT_QUEUE)
    const validation = validateTransition(current.current_state, ProductionState.PRINT_QUEUE);
    if (!validation.is_valid) {
      return { success: false, error: validation.errors.join(' ') };
    }

    const newEntry = buildTransitionEntry(
      current.current_state,
      ProductionState.PRINT_QUEUE,
      { ...metadata, reason: metadata?.reason ?? 'Retry attempt' }
    );

    const { data: updated, error: updateError } = await this.supabase
      .from('production_orders')
      .update({
        current_state: ProductionState.PRINT_QUEUE,
        state_history: [...current.state_history, newEntry],
        retry_count: current.retry_count + 1,
        error_message: null,
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateError) {
      return { success: false, error: `Failed to retry order: ${updateError.message}` };
    }

    return { success: true, data: updated as ProductionOrder };
  }

  // ------------------------------------------
  // cancel
  // ------------------------------------------

  /**
   * Transitions the order to CANCELLED, recording the cancellation reason
   * in both the state_history metadata and the error_message field.
   *
   * Cannot cancel an already-SHIPPED order.
   *
   * Requirements: 4.9
   */
  async cancel(
    orderId: string,
    reason: string,
    metadata?: Omit<StateMetadata, 'reason'>
  ): Promise<ProductionOrderResult> {
    const { data: order, error: fetchError } = await this.supabase
      .from('production_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: `Production order "${orderId}" not found.` };
    }

    const current = order as ProductionOrder;

    if (current.current_state === ProductionState.SHIPPED) {
      return {
        success: false,
        error: `Cannot cancel order "${orderId}" — it has already been shipped.`,
      };
    }

    if (current.current_state === ProductionState.CANCELLED) {
      return {
        success: false,
        error: `Order "${orderId}" is already cancelled.`,
      };
    }

    const validation = validateTransition(current.current_state, ProductionState.CANCELLED);
    if (!validation.is_valid) {
      return { success: false, error: validation.errors.join(' ') };
    }

    const newEntry = buildTransitionEntry(
      current.current_state,
      ProductionState.CANCELLED,
      { ...metadata, reason }
    );

    const { data: updated, error: updateError } = await this.supabase
      .from('production_orders')
      .update({
        current_state: ProductionState.CANCELLED,
        state_history: [...current.state_history, newEntry],
        error_message: reason,
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateError) {
      return { success: false, error: `Failed to cancel order: ${updateError.message}` };
    }

    return { success: true, data: updated as ProductionOrder };
  }
}