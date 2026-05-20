/**
 * Production Workflow Type Definitions
 *
 * Types for the manufacturing workflow state machine for both
 * predesigned (inventory-based) and custom (made-to-order) phone cases.
 *
 * Requirements: 4.1, 4.2, 4.4
 */

// =============================================
// ENUMS
// =============================================

/**
 * All possible states in the production workflow state machine.
 * Matches the production_state database enum.
 */
export enum ProductionState {
  ORDER_RECEIVED = 'ORDER_RECEIVED',
  DESIGN_VALIDATED = 'DESIGN_VALIDATED',
  PRINT_QUEUE = 'PRINT_QUEUE',
  PRINTING = 'PRINTING',
  PRINT_COMPLETED = 'PRINT_COMPLETED',
  PRINT_FAILED = 'PRINT_FAILED',
  QUALITY_CHECK = 'QUALITY_CHECK',
  QUALITY_PASSED = 'QUALITY_PASSED',
  QUALITY_FAILED = 'QUALITY_FAILED',
  PACKAGING = 'PACKAGING',
  READY_TO_SHIP = 'READY_TO_SHIP',
  SHIPPED = 'SHIPPED',
  CANCELLED = 'CANCELLED',
}

/**
 * Discriminates between predesigned (inventory) and custom (made-to-order) products.
 * Matches the product_type CHECK constraint in production_orders table.
 */
export enum ProductType {
  PREDESIGNED = 'predesigned',
  CUSTOM = 'custom',
}

// =============================================
// INTERFACES
// =============================================

/**
 * Metadata attached to a state transition, capturing contextual information
 * about why or how the transition occurred.
 */
export interface StateMetadata {
  /** User or system actor that triggered the transition */
  triggered_by?: string;
  /** Human-readable reason for the transition */
  reason?: string;
  /** ID of the operator or automated system that performed the action */
  operator_id?: string;
  /** Any additional context specific to the transition type */
  [key: string]: unknown;
}

/**
 * A single entry in the state_history JSONB array, recording each
 * state transition with its timestamp and optional metadata.
 */
export interface StateTransition {
  /** The state before this transition */
  from_state: ProductionState;
  /** The state after this transition */
  to_state: ProductionState;
  /** ISO 8601 timestamp when the transition occurred */
  transitioned_at: string;
  /** Optional metadata about the transition */
  metadata?: StateMetadata;
}

/**
 * Full production order record matching the production_orders database table.
 */
export interface ProductionOrder {
  /** Primary key UUID */
  id: string;

  // Order references
  /** Reference to the parent order */
  order_id: string;
  /** Reference to the specific order item being produced */
  order_item_id: string;

  // Product references
  /** Reference to the product variant (model + product_type + color) */
  variant_id: string;
  /** Discriminator: predesigned (inventory) or custom (made-to-order) */
  product_type: ProductType;
  /** Reference to design (for predesigned products); null for custom */
  design_id: string | null;

  // Custom design data
  /** Custom design layers and elements (for custom products); null for predesigned */
  customization_data: Record<string, unknown> | null;

  // Print file
  /** URL to the print-ready file; required before entering PRINT_QUEUE state */
  print_file_url: string | null;

  // State machine
  /** Current state in the production workflow */
  current_state: ProductionState;
  /** Ordered array of state transitions with timestamps and metadata */
  state_history: StateTransition[];

  // Priority & retry management
  /** Priority level 0–100 for queue processing; higher = more urgent */
  priority: number;
  /** Number of retry attempts for failed operations */
  retry_count: number;
  /** Maximum retry attempts before the order is cancelled */
  max_retries: number;

  // Error tracking
  /** Error details from the most recent failed operation */
  error_message: string | null;

  // Timestamps
  /** ISO 8601 timestamp when the production order was created */
  created_at: string;
  /** ISO 8601 timestamp of the most recent update */
  updated_at: string;
  /** ISO 8601 timestamp when the order was shipped; null until SHIPPED state */
  shipped_at: string | null;
}

/**
 * Result of a validation check, indicating success or failure with
 * a list of human-readable error messages.
 */
export interface ValidationResult {
  /** Whether the validation passed */
  is_valid: boolean;
  /** List of validation error messages; empty when is_valid is true */
  errors: string[];
}