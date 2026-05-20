/**
 * Production Order State Transition API Route
 *
 * POST /api/production-orders/[id]/transition
 *
 * Transitions a production order to a new state.
 * Admin only.
 *
 * Requirements: 4.4, 4.5, 4.9
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { validateAdminAccess } from '@/src/lib/auth/api-auth';
import { ProductionOrderManager } from '@/src/lib/production/production-order-manager';
import { ProductionState } from '@/src/types/production';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await validateAdminAccess();
    if (!auth.isValid) return auth.response;

    const supabase = await createClient();
    const body = await request.json();
    const { to_state, reason, operator_id } = body;

    if (!to_state) {
      return NextResponse.json(
        { error: 'to_state is required' },
        { status: 400 }
      );
    }

    if (!Object.values(ProductionState).includes(to_state)) {
      return NextResponse.json(
        { error: `Invalid state "${to_state}". Must be one of: ${Object.values(ProductionState).join(', ')}.` },
        { status: 400 }
      );
    }

    const manager = new ProductionOrderManager(supabase);
    const result = await manager.transitionState(
      params.id,
      to_state,
      {
        triggered_by: 'admin',
        reason: reason ?? 'Manual state transition',
        operator_id: operator_id ?? undefined,
      }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json({ production_order: result.data });
  } catch (err) {
    console.error('POST /api/production-orders/[id]/transition error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
