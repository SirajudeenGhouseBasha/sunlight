/**
 * Product Type Discriminator Utilities
 *
 * Functions for identifying and validating whether a cart item or order item
 * represents a predesigned (inventory-based) or custom (made-to-order) product.
 *
 * Requirements: 1.1, 1.5
 */

import { ProductType, ValidationResult } from '@/src/types/production';
import type { CustomizationData } from '@/src/types/custom-design';

// =============================================
// SHARED ITEM SHAPE
// =============================================

/**
 * Minimal shape shared by cart_items and order_items that carries the
 * fields needed for product-type discrimination.
 */
export interface DiscriminableItem {
  /** Design ID set for predesigned products; null/undefined for custom */
  design_id?: string | null;
  /** Custom design payload set for custom products; null/undefined for predesigned */
  custom_design_data?: CustomizationData | Record<string, unknown> | null;
  /**
   * Optional explicit product_type value.
   * When present, used as an authoritative source for discrimination;
   * otherwise inferred from design_id / custom_design_data.
   */
  product_type?: string | null;
}

// =============================================
// CORE DISCRIMINATOR
// =============================================

/**
 * Determines whether a cart or order item is predesigned or custom.
 *
 * Priority:
 *  1. Explicit `product_type` field (if it matches a known enum value)
 *  2. Presence of `design_id`  → predesigned
 *  3. Presence of `custom_design_data` → custom
 *
 * @param item - A cart item, order item, or any object with the discriminable fields.
 * @returns The resolved {@link ProductType}, or `null` if it cannot be determined.
 */
export function getProductType(item: DiscriminableItem): ProductType | null {
  // 1. Honour an explicit product_type field when it's a known value
  if (item.product_type) {
    if (item.product_type === ProductType.PREDESIGNED) return ProductType.PREDESIGNED;
    if (item.product_type === ProductType.CUSTOM) return ProductType.CUSTOM;
  }

  // 2. Infer from presence of design_id
  if (item.design_id != null && item.design_id !== '') {
    return ProductType.PREDESIGNED;
  }

  // 3. Infer from presence of custom_design_data
  if (item.custom_design_data != null) {
    return ProductType.CUSTOM;
  }

  // 4. Cannot determine
  return null;
}

// =============================================
// BOOLEAN HELPERS
// =============================================

/**
 * Returns `true` when the item is a predesigned (inventory-backed) product.
 *
 * @param item - A cart item, order item, or any discriminable object.
 */
export function isPredesigned(item: DiscriminableItem): boolean {
  return getProductType(item) === ProductType.PREDESIGNED;
}

/**
 * Returns `true` when the item is a custom (made-to-order) product.
 *
 * @param item - A cart item, order item, or any discriminable object.
 */
export function isCustom(item: DiscriminableItem): boolean {
  return getProductType(item) === ProductType.CUSTOM;
}

// =============================================
// VALIDATION
// =============================================

/**
 * Validates that an item's product type fields are internally consistent.
 *
 * Rules enforced:
 * - Exactly one of `design_id` or `custom_design_data` must be set, not both and not neither.
 * - If `product_type` is explicitly provided it must match a known {@link ProductType} value.
 * - If `product_type` is `predesigned`, a `design_id` must be present.
 * - If `product_type` is `custom`, `custom_design_data` must be present.
 * - `design_id` and `custom_design_data` must not both be set simultaneously.
 *
 * @param item - The item to validate.
 * @returns A {@link ValidationResult} describing any consistency violations found.
 */
export function validateProductType(item: DiscriminableItem): ValidationResult {
  const errors: string[] = [];

  const hasDesignId = item.design_id != null && item.design_id !== '';
  const hasCustomData = item.custom_design_data != null;
  const explicitType = item.product_type;

  // Rule 1: must not have both fields set
  if (hasDesignId && hasCustomData) {
    errors.push(
      'Item cannot have both design_id (predesigned) and custom_design_data (custom) set simultaneously.'
    );
  }

  // Rule 2: must have at least one field set
  if (!hasDesignId && !hasCustomData) {
    errors.push(
      'Item must have either design_id (predesigned) or custom_design_data (custom) set.'
    );
  }

  // Rule 3: explicit product_type must be a known value
  if (explicitType != null) {
    if (
      explicitType !== ProductType.PREDESIGNED &&
      explicitType !== ProductType.CUSTOM
    ) {
      errors.push(
        `Unknown product_type "${explicitType}". Expected "${ProductType.PREDESIGNED}" or "${ProductType.CUSTOM}".`
      );
    } else {
      // Rule 4: explicit type must agree with the data fields
      if (explicitType === ProductType.PREDESIGNED && !hasDesignId) {
        errors.push(
          `product_type is "${ProductType.PREDESIGNED}" but design_id is missing.`
        );
      }
      if (explicitType === ProductType.CUSTOM && !hasCustomData) {
        errors.push(
          `product_type is "${ProductType.CUSTOM}" but custom_design_data is missing.`
        );
      }
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
  };
}