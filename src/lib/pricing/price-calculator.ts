/**
 * Price Calculator Service
 *
 * Calculates unit prices and totals for both predesigned (inventory) and
 * custom (made-to-order) phone case products, and formats currency values.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

// =============================================
// TYPES
// =============================================

/** Pricing data for a predesigned variant (comes from the variants table). */
export interface PredesignedPricingInput {
  /** Base price of the design in the smallest currency unit (e.g. pence / cents). */
  base_price: number;
  /** Optional per-variant price modifier (positive = surcharge, negative = discount). */
  price_modifier: number;
  /**
   * When set, this value is used directly as the unit price, ignoring
   * base_price and price_modifier.
   */
  price_override?: number | null;
}

/** Pricing data for a custom product variant. */
export interface CustomPricingInput {
  /**
   * Base price for the product type (material), e.g. the cost of a
   * silicone case before any variant modifiers.
   */
  base_price: number;
  /**
   * Per-variant price modifier for the selected model/colour combination.
   */
  price_modifier: number;
}

/** Inputs needed to compute a line-item total. */
export interface OrderItemPricingInput {
  unit_price: number;
  quantity: number;
}

// =============================================
// PRICE CALCULATORS
// =============================================

/**
 * Returns the unit price for a predesigned product variant.
 *
 * When `price_override` is set (non-null, non-undefined), it takes
 * precedence over the base + modifier formula. The result is clamped
 * to zero so prices are always non-negative.
 *
 * Requirements: 6.1, 6.4, 6.5
 */
export function calculatePredesignedPrice(input: PredesignedPricingInput): number {
  if (input.price_override != null) {
    return Math.max(0, input.price_override);
  }
  return Math.max(0, input.base_price + input.price_modifier);
}

/**
 * Returns the unit price for a custom product variant.
 *
 * Price = product_type.base_price + variant.price_modifier
 * Result is clamped to zero.
 *
 * Requirements: 6.2, 6.4, 6.5
 */
export function calculateCustomPrice(input: CustomPricingInput): number {
  return Math.max(0, input.base_price + input.price_modifier);
}

/**
 * Returns the total price for a line item (unit_price × quantity).
 * Both inputs are validated to be non-negative before multiplication.
 *
 * Requirements: 6.3, 6.5
 */
export function calculateOrderItemTotal(input: OrderItemPricingInput): number {
  const unitPrice = Math.max(0, input.unit_price);
  const quantity = Math.max(0, input.quantity);
  return unitPrice * quantity;
}

// =============================================
// FORMATTING
// =============================================

/**
 * Formats a numeric price value as a fixed two-decimal-place string.
 *
 * The value is treated as a standard decimal currency amount (e.g. 9.99
 * represents ₹9.99). Negative values are clamped to "0.00".
 *
 * @example
 * formatPrice(9.9)    // "9.90"
 * formatPrice(10)     // "10.00"
 * formatPrice(9.999)  // "10.00"  (standard rounding)
 * formatPrice(-1)     // "0.00"
 *
 * Requirements: 6.4
 */
export function formatPrice(value: number): string {
  return Math.max(0, value).toFixed(2);
}