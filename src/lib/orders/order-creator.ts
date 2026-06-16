import { SupabaseClient } from '@supabase/supabase-js';
import { StockManager } from '@/src/lib/products/stock-manager';
import { getProductType } from '@/src/utils/product-type-discriminator';

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

export interface Cart {
  id: string;
  user_id: string;
}

export interface DeliveryLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface CreateOrderOptions {
  shipping_address: Record<string, string>;
  billing_address?: Record<string, string>;
  notes?: string;
  payment_method?: string;
  upi_transaction_id?: string;
  payment_screenshot_url?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_location?: DeliveryLocation;
}

export interface CreateOrderResult {
  success: boolean;
  order_id?: string;
  error?: string;
}

export class OrderCreator {
  private readonly stock: StockManager;

  constructor(private readonly supabase: SupabaseClient) {
    this.stock = new StockManager(supabase);
  }

  async createOrderFromCart(
    userId: string,
    options: CreateOrderOptions
  ): Promise<CreateOrderResult> {
    const { data: cartItems, error: cartError } = await this.supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId);

    if (cartError) {
      return { success: false, error: `Failed to load cart items: ${cartError.message}` };
    }

    if (!cartItems || cartItems.length === 0) {
      return { success: false, error: 'Cart is empty. Cannot create an order.' };
    }

    const items = cartItems as CartItem[];

    const stockErrors = await this.validateStock(items);
    if (stockErrors.length > 0) {
      return { success: false, error: stockErrors.join(' ') };
    }

    const totalPrice = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `PC${dateStr}-${randomSuffix}`;

    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        shipping_address: options.shipping_address,
        billing_address: options.billing_address ?? options.shipping_address,
        notes: options.notes ?? null,
        subtotal: totalPrice,
        total_amount: totalPrice,
        status: 'PENDING_PAYMENT',
        payment_method: options.payment_method ?? null,
        upi_transaction_id: options.upi_transaction_id ?? null,
        payment_screenshot_url: options.payment_screenshot_url ?? null,
        customer_name: options.customer_name ?? null,
        customer_phone: options.customer_phone ?? null,
        customer_email: options.customer_email ?? null,
        delivery_location: options.delivery_location ?? null,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      return { success: false, error: `Failed to create order: ${orderError?.message}` };
    }

    const orderId: string = (order as { id: string }).id;

    try {
      await this.createOrderItems(orderId, items);
    } catch (err) {
      await this.supabase.from('orders').delete().eq('id', orderId);
      return {
        success: false,
        error: `Failed to create order items: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    await this.clearCart(userId);

    return { success: true, order_id: orderId };
  }

  async validateStock(items: CartItem[]): Promise<string[]> {
    const errors: string[] = [];

    for (const item of items) {
      if (getProductType(item) !== 'predesigned') continue;

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

  async createOrderItems(orderId: string, items: CartItem[]): Promise<string[]> {
    const orderItemIds: string[] = [];
    const decrementedVariants: Array<{ variant_id: string; quantity: number }> = [];

    const variantIds = items.map((i) => i.variant_id).filter(Boolean);
    let variantNamesMap: Record<string, { product_name: string; variant_name: string }> = {};

    if (variantIds.length > 0) {
      const { data: variants } = await this.supabase
        .from('variants')
        .select(`
          id, name, color_name,
          model:models!inner(
            name,
            brand:brands!inner(name)
          )
        `)
        .in('id', variantIds);

      if (variants) {
        for (const v of variants) {
          const vAny = v as unknown as {
            id: string;
            name: string;
            color_name: string;
            model: { name: string; brand: { name: string } };
          };
          variantNamesMap[vAny.id] = {
            product_name: `${vAny.model.brand.name} ${vAny.model.name}`,
            variant_name: vAny.color_name || vAny.name,
          };
        }
      }
    }

    for (const item of items) {
      const productType = getProductType(item);

      if (productType === 'predesigned') {
        const stockResult = await this.stock.decrementStock(
          item.variant_id,
          item.quantity,
          orderId
        );
        if (!stockResult.success) {
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

      const names = variantNamesMap[item.variant_id] ?? {
        product_name: 'Phone Case',
        variant_name: 'Standard',
      };

      const { data: orderItem, error: itemError } = await this.supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          variant_id: item.variant_id,
          product_name: names.product_name,
          variant_name: names.variant_name,
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

  async clearCart(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.warn(`[OrderCreator.clearCart] Failed to clear cart for user "${userId}": ${error.message}`);
    }
  }
}
