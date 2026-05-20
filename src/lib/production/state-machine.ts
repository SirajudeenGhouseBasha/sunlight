/**
 * Production Order State Machine
 *
 * Defines and enforces the valid state transitions for the manufacturing
 * workflow. All state changes must pass through this module's validation
 * before being committed to the database.
 *
 * Requirements: 4.4, 4.5, 4.9
 */

import { ProductionState, ValidationResult } from '@/src/types/production';

// =============================================
// VALID TRANSITIONS MAP
// =============================================

/**
 * Exhaustive map of every state to the set of states it is allowed to
 * transition into. Any transition not listed here is invalid.
 *
 * Workflow (happy path):
 *   ORDER_RECEIVED → DESIGN_VALIDATED → PRINT_QUEUE → PRINTING
 *     → PRINT_COMPLETED → QUALITY_CHECK → QUALITY_PASSED
 *     → PACKAGING → READY_TO_SHIP → SHIPPED
 *
 * Failure / retry paths:
 *   PRINTING       → PRINT_FAILED  → PRINT_QUEUE (retry) | CANCELLED
 *   QUALITY_CHECK  → QUALITY_FAILED → PRINT_QUEUE (retry) | CANCELLED
 *   QUALITY_PASSED → QUALITY_FAILED (re-inspection) | PACKAGING
 *
 * Cancellation is allowed from any non-terminal state except SHIPPED.
 */
export const VALID_TRANSITIONS: Readonly<Record<ProductionState, ReadonlyArray<ProductionState>>> = {
  [ProductionState.ORDER_RECEIVED]: [
    ProductionState.DESIGN_VALIDATED,
    ProductionState.CANCELLED,
  ],

  [ProductionState.DESIGN_VALIDATED]: [
    ProductionState.PRINT_QUEUE,
    ProductionState.CANCELLED,
  ],

  [ProductionState.PRINT_QUEUE]: [
    ProductionState.PRINTING,
    ProductionState.CANCELLED,
  ],

  [ProductionState.PRINTING]: [
    ProductionState.PRINT_COMPLETED,
    ProductionState.PRINT_FAILED,
    ProductionState.CANCELLED,
  ],

  [ProductionState.PRINT_COMPLETED]: [
    ProductionState.QUALITY_CHECK,
    ProductionState.CANCELLED,
  ],

  [ProductionState.PRINT_FAILED]: [
    ProductionState.PRINT_QUEUE,   // retry
    ProductionState.CANCELLED,
  ],

  [ProductionState.QUALITY_CHECK]: [
    ProductionState.QUALITY_PASSED,
    ProductionState.QUALITY_FAILED,
    ProductionState.CANCELLED,
  ],

  [ProductionState.QUALITY_PASSED]: [
    ProductionState.PACKAGING,
    ProductionState.QUALITY_FAILED, // re-inspection downgrade
    ProductionState.CANCELLED,
  ],

  [ProductionState.QUALITY_FAILED]: [
    ProductionState.PRINT_QUEUE,   // retry from scratch
    ProductionState.CANCELLED,
  ],

  [ProductionState.PACKAGING]: [
    ProductionState.READY_TO_SHIP,
    ProductionState.CANCELLED,
  ],

  [ProductionState.READY_TO_SHIP]: [
    ProductionState.SHIPPED,
    ProductionState.CANCELLED,
  ],

  // Terminal states — no outbound transitions
  [ProductionState.SHIPPED]: [],
  [ProductionState.CANCELLED]: [],
} as const;

// =============================================
// TERMINAL STATES
// =============================================

/** States from which no further transitions are permitted. */
const TERMINAL_STATES = new Set<ProductionState>([
  ProductionState.SHIPPED,
  ProductionState.CANCELLED,
]);

// =============================================
// PUBLIC API
// =============================================

/**
 * Checks whether a transition from `fromState` to `toState` is permitted
 * according to `VALID_TRANSITIONS`.
 *
 * @param fromState - The current state of the production order.
 * @param toState   - The desired next state.
 * @returns A {@link ValidationResult} that is valid when the transition is allowed.
 */
export function validateTransition(
  fromState: ProductionState,
  toState: ProductionState
): ValidationResult {
  const allowed = VALID_TRANSITIONS[fromState];

  if (!allowed) {
    return {
      is_valid: false,
      errors: [`Unknown state "${fromState}". Cannot determine valid transitions.`],
    };
  }

  if (isTerminalState(fromState)) {
    return {
      is_valid: false,
      errors: [
        `State "${fromState}" is terminal. No further transitions are allowed.`,
      ],
    };
  }

  if (!(allowed as ReadonlyArray<ProductionState>).includes(toState)) {
    return {
      is_valid: false,
      errors: [
        `Transition from "${fromState}" to "${toState}" is not allowed. ` +
          `Valid next states: [${allowed.join(', ') || 'none'}].`,
      ],
    };
  }

  return { is_valid: true, errors: [] };
}

/**
 * Returns the list of states that a production order in `currentState`
 * is allowed to move to next.
 *
 * @param currentState - The current state of the production order.
 * @returns An array of valid next {@link ProductionState} values (may be empty for terminal states).
 */
export function getValidNextStates(currentState: ProductionState): ProductionState[] {
  return [...(VALID_TRANSITIONS[currentState] ?? [])];
}

/**
 * Returns `true` when `state` is a terminal state (SHIPPED or CANCELLED),
 * meaning no further transitions are possible.
 *
 * @param state - The state to test.
 */
export function isTerminalState(state: ProductionState): boolean {
  return TERMINAL_STATES.has(state);
}