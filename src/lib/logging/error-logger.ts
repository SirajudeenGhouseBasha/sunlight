/**
 * Error Logger Service
 *
 * Centralised logging for production workflow errors.
 * Writes to console in development; in production this can be
 * swapped for an external service (Sentry, Datadog, etc.) by
 * replacing the `emit` function below.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

// =============================================
// TYPES
// =============================================

export type ErrorCategory =
  | 'production_order'
  | 'state_transition'
  | 'validation'
  | 'stock'
  | 'order_creation'
  | 'general';

export interface ErrorLogEntry {
  category: ErrorCategory;
  message: string;
  production_order_id?: string;
  user_id?: string;
  timestamp: string;
  stack_trace?: string;
  context?: Record<string, unknown>;
}

// =============================================
// EMIT (swap this for external service)
// =============================================

function emit(entry: ErrorLogEntry): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(
      `[${entry.category.toUpperCase()}] ${entry.timestamp} — ${entry.message}`,
      entry.context ?? '',
      entry.stack_trace ? `\n${entry.stack_trace}` : ''
    );
  } else {
    // Production: replace with Sentry.captureException / Datadog / etc.
    console.error(JSON.stringify(entry));
  }
}

// =============================================
// PUBLIC API
// =============================================

/**
 * Log a production order error (print failure, state error, etc.)
 * Requirements: 10.1, 10.2
 */
export function logProductionError(
  message: string,
  opts: {
    production_order_id?: string;
    user_id?: string;
    error?: unknown;
    context?: Record<string, unknown>;
  } = {}
): void {
  emit({
    category: 'production_order',
    message,
    production_order_id: opts.production_order_id,
    user_id: opts.user_id,
    timestamp: new Date().toISOString(),
    stack_trace: opts.error instanceof Error ? opts.error.stack : undefined,
    context: opts.context,
  });
}

/**
 * Log an invalid state transition attempt.
 * Requirements: 10.2
 */
export function logStateTransitionError(
  message: string,
  opts: {
    production_order_id?: string;
    from_state?: string;
    to_state?: string;
    user_id?: string;
    error?: unknown;
  } = {}
): void {
  emit({
    category: 'state_transition',
    message,
    production_order_id: opts.production_order_id,
    user_id: opts.user_id,
    timestamp: new Date().toISOString(),
    stack_trace: opts.error instanceof Error ? opts.error.stack : undefined,
    context: {
      from_state: opts.from_state,
      to_state: opts.to_state,
    },
  });
}

/**
 * Log a design or product-type validation failure.
 * Requirements: 10.3
 */
export function logValidationError(
  message: string,
  opts: {
    production_order_id?: string;
    user_id?: string;
    errors?: string[];
    context?: Record<string, unknown>;
  } = {}
): void {
  emit({
    category: 'validation',
    message,
    production_order_id: opts.production_order_id,
    user_id: opts.user_id,
    timestamp: new Date().toISOString(),
    context: { validation_errors: opts.errors, ...opts.context },
  });
}

/**
 * Log a stock management error (oversell attempt, concurrent modification, etc.)
 * Requirements: 9.2, 9.3, 10.1
 */
export function logStockError(
  message: string,
  opts: {
    variant_id?: string;
    order_id?: string;
    requested_quantity?: number;
    available_stock?: number;
    error?: unknown;
  } = {}
): void {
  emit({
    category: 'stock',
    message,
    timestamp: new Date().toISOString(),
    stack_trace: opts.error instanceof Error ? opts.error.stack : undefined,
    context: {
      variant_id: opts.variant_id,
      order_id: opts.order_id,
      requested_quantity: opts.requested_quantity,
      available_stock: opts.available_stock,
    },
  });
}

/**
 * Generic error logger for uncategorised errors.
 * Requirements: 10.4
 */
export function logGeneralError(
  message: string,
  opts: {
    error?: unknown;
    context?: Record<string, unknown>;
  } = {}
): void {
  emit({
    category: 'general',
    message,
    timestamp: new Date().toISOString(),
    stack_trace: opts.error instanceof Error ? opts.error.stack : undefined,
    context: opts.context,
  });
}
