/**
 * Production Order Retry API Route
 *
 * POST /api/production-orders/[id]/retry
 *
 * Manually retries a failed production order.
 * Admin only.
 *
 * Requirements: 4.6, 4.7
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

    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json().catch(() => ({}));
    const { operator_id } = body;

    const manager = new ProductionOrderManager(supabase);
    const result = await manager.retry(
      id,
      {
        triggered_by: 'admin',
        reason: 'Manual retry by admin',
        operator_id: operator_id ?? undefined,
      }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json({ production_order: result.data });
  } catch (err) {
    console.error('POST /api/production-orders/[id]/retry error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
