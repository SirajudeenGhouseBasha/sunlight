/**
 * Production Order Cancel API Route
 *
 * POST /api/production-orders/[id]/cancel
 *
 * Cancels a production order with a reason.
 * Admin only.
 *
 * Requirements: 4.9
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { validateAdminAccess } from '@/src/lib/auth/api-auth';
import { ProductionOrderManager } from '@/src/lib/production/production-order-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateAdminAccess();
    if (!auth.isValid) return auth.response;

    const supabase = await createClient();
    const body = await request.json();
    const { reason, operator_id } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    const resolvedParams = await params;
    const manager = new ProductionOrderManager(supabase);
    const result = await manager.cancel(
      resolvedParams.id,
      reason,
      {
        triggered_by: 'admin',
        operator_id: operator_id ?? undefined,
      }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json({ production_order: result.data });
  } catch (err) {
    console.error('POST /api/production-orders/[id]/cancel error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
