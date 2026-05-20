/**
 * Order Creator Service
 *
 * Converts a customer's cart into a confirmed order, creates order items,
 * spins up production orders for each item, and clears the cart — all
 * atomically so that a partial failure leaves no orphaned records.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ProductType } from '@/src/types/production';
import { ProductionOrderManager } from '@/src/lib/production/production-order-manager';
import { StockManager } from '@/src/lib/products/stock-manager';
import { getProductType } from '@/src/utils/product-type-discriminator';

// =============================================
// TYPES
// =============================================

/** A cart item row as returned by Supabase. */
export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  design_id?: string | null;
  custom_design_data?: Record<string, unknown> | null;
  product_type?: string | null;
  model_id?: string | null;
  product_type_id?: string | null;
}

/** Minimal cart row. */
export interface Cart {
  id: string;
  user_id: string;
}

/** Options forwarded to the order creator. */
export interface CreateOrderOptions {
  /** Shipping address ID to attach to the order. */
  shipping_address_id: string;
  /** Optional notes from the customer. */
  notes?: string;
}

export interface CreateOrderResult {
  success: boolean;
  order_id?: string;
  error?: string;
}

// =============================================
// HELPERS
// =============================================

/**
 * Derives the `ProductType` enum value from a raw cart item, falling back to
 * the discriminator utility when the explicit field is absent.
 */
function resolveProductType(item: CartItem): ProductType {
  if (item.product_type === ProductType.PREDESIGNED) return ProductType.PREDESIGNED;
  if (item.product_type === ProductType.CUSTOM) return ProductType.CUSTOM;
  // Infer from data fields
  const inferred = getProductType(item);
  return inferred ?? ProductType.PREDESIGNED;
}

// =============================================
// ORDER CREATOR
// =============================================

export class OrderCreator {
  private readonly manager: ProductionOrderManager;
  private readonly stock: StockManager;

  constructor(private readonly supabase: SupabaseClient) {
    this.manager = new ProductionOrderManager(supabase);
    this.stock = new StockManager(supabase);
  }

  // ------------------------------------------
  // createOrderFromCart
  // ------------------------------------------

  /**
   * Main entry point. Orchestrates the full cart → order conversion:
   *
   *  1. Load cart + cart items
   *  2. Validate stock for all predesigned items
   *  3. Create the order record
   *  4. Create order_items from cart_items (decrement stock for predesigned)
   *  5. Create a production_order for every order_item
   *  6. Clear the cart
   *
   * Supabase does not expose client-side multi-statement transactions, so
   * atomicity is approximated by:
   *   - Running all validation before any writes
   *   - Rolling back via compensating writes (delete order + restore stock)
   *     if a later step fails
   *
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  async createOrderFromCart(
    cartId: string,
    userId: string,
    options: CreateOrderOptions
  ): Promise<CreateOrderResult> {
    // ── 1. Load cart items ──────────────────────────────────────────────
    const { data: cartItems, error: cartError } = await this.supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId);

    if (cartError) {
      return { success: false, error: `Failed to load cart items: ${cartError.message}` };
    }

    if (!cartItems || cartItems.length === 0) {
      return { success: false, error: 'Cart is empty. Cannot create an order.' };
    }

    const items = cartItems as CartItem[];

    // ── 2. Stock validation (predesigned only) ──────────────────────────
    const stockErrors = await this.validateStock(items);
    if (stockErrors.length > 0) {
      return { success: false, error: stockErrors.join(' ') };
    }

    // ── 3. Create the order record ──────────────────────────────────────
    const totalPrice = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        user_id: userId,
        shipping_address_id: options.shipping_address_id,
        notes: options.notes ?? null,
        total_price: totalPrice,
        status: 'pending',
      })
      .select('id')
      .single();

    if (orderError || !order) {
      return { success: false, error: `Failed to create order: ${orderError?.message}` };
    }

    const orderId: string = (order as { id: string }).id;

    // ── 4. Create order_items + decrement stock ─────────────────────────
    let orderItemIds: string[];
    try {
      orderItemIds = await this.createOrderItems(orderId, items);
    } catch (err) {
      // Compensate: delete the orphaned order
      await this.supabase.from('orders').delete().eq('id', orderId);
      return {
        success: false,
        error: `Failed to create order items: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    // ── 5. Create production orders ─────────────────────────────────────
    try {
      await this.createProductionOrders(orderId, items, orderItemIds);
    } catch (err) {
      // Compensate: restore stock then delete order (cascade deletes order_items)
      await this.restoreStock(items);
      await this.supabase.from('orders').delete().eq('id', orderId);
      return {
        success: false,
        error: `Failed to create production orders: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    // ── 6. Clear the cart ───────────────────────────────────────────────
    await this.clearCart(cartId);

    return { success: true, order_id: orderId };
  }

  // ------------------------------------------
  // validateStock
  // ------------------------------------------

  /**
   * Checks that every predesigned item in the cart has sufficient stock.
   * Returns a list of error strings (empty = all ok).
   *
   * Requirements: 7.5
   */
  async validateStock(items: CartItem[]): Promise<string[]> {
    const errors: string[] = [];

    for (const item of items) {
      if (resolveProductType(item) !== ProductType.PREDESIGNED) continue;

      const check = await this.stock.checkStock(item.variant_id, item.quantity);
      if (!check.available) {
        errors.push(
          `Insufficient stock for variant "${item.variant_id}". ` +
            `Requested: ${item.quantity}, available: ${check.current_stock}.`
        );
      }
    }

    return errors;
  }

  // ------------------------------------------
  // createOrderItems
  // ------------------------------------------

  /**
   * Inserts an order_item row for every cart item and decrements stock for
   * predesigned products. Returns the list of created order_item IDs in the
   * same order as `items`.
   *
   * Throws on any database or stock error so the caller can compensate.
   *
   * Requirements: 7.2, 7.4
   */
  async createOrderItems(orderId: string, items: CartItem[]): Promise<string[]> {
    const orderItemIds: string[] = [];
    const decrementedVariants: Array<{ variant_id: string; quantity: number }> = [];

    for (const item of items) {
      const productType = resolveProductType(item);

      // Decrement stock atomically before inserting the order item
      if (productType === ProductType.PREDESIGNED) {
        const stockResult = await this.stock.decrementStock(
          item.variant_id,
          item.quantity,
          orderId
        );
        if (!stockResult.success) {
          // Restore all stock decremented so far, then throw
          for (const decremented of decrementedVariants) {
            await this.stock.incrementStock(
              decremented.variant_id,
              decremented.quantity,
              'Rollback: order item creation failed'
            );
          }
          throw new Error(stockResult.error ?? `Failed to decrement stock for variant "${item.variant_id}".`);
        }
        decrementedVariants.push({ variant_id: item.variant_id, quantity: item.quantity });
      }

      const { data: orderItem, error: itemError } = await this.supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
          design_id: item.design_id ?? null,
          custom_design_data: item.custom_design_data ?? null,
          product_type_id: item.product_type_id ?? null,
          model_id: item.model_id ?? null,
        })
        .select('id')
        .single();

      if (itemError || !orderItem) {
        // Restore all stock decremented so far, then throw
        for (const decremented of decrementedVariants) {
          await this.stock.incrementStock(
            decremented.variant_id,
            decremented.quantity,
            'Rollback: order item insert failed'
          );
        }
        throw new Error(`Failed to insert order item for variant "${item.variant_id}": ${itemError?.message}`);
      }

      orderItemIds.push((orderItem as { id: string }).id);
    }

    return orderItemIds;
  }

  // ------------------------------------------
  // createProductionOrders
  // ------------------------------------------

  /**
   * Creates a production_order for each order_item. Items and IDs are
   * expected to be parallel arrays (same index = same item).
   *
   * Throws if any production order creation fails.
   *
   * Requirements: 7.3
   */
  async createProductionOrders(
    orderId: string,
    items: CartItem[],
    orderItemIds: string[]
  ): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const orderItemId = orderItemIds[i];
      const productType = resolveProductType(item);

      const result = await this.manager.createProductionOrder({
        order_id: orderId,
        order_item_id: orderItemId,
        variant_id: item.variant_id,
        product_type: productType,
        design_id: item.design_id ?? null,
        customization_data: item.custom_design_data ?? null,
      });

      if (!result.success) {
        throw new Error(
          result.error ?? `Failed to create production order for order_item "${orderItemId}".`
        );
      }
    }
  }

  // ------------------------------------------
  // clearCart
  // ------------------------------------------

  /**
   * Removes all items from the cart after a successful order creation.
   * Failure here is logged but does not roll back the order — the order
   * exists and is valid; stale cart items are a minor UX issue.
   *
   * Requirements: 7.4
   */
  async clearCart(cartId: string): Promise<void> {
    const { error } = await this.supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (error) {
      console.warn(`[OrderCreator.clearCart] Failed to clear cart "${cartId}": ${error.message}`);
    }
  }

  // ------------------------------------------
  // restoreStock (compensating action)
  // ------------------------------------------

  /** Restores stock for all predesigned items — used as a rollback step. */
  private async restoreStock(items: CartItem[]): Promise<void> {
    for (const item of items) {
      if (resolveProductType(item) !== ProductType.PREDESIGNED) continue;
      await this.stock.incrementStock(
        item.variant_id,
        item.quantity,
        'Rollback: production order creation failed'
      );
    }
  }
}