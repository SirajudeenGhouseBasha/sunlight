/**
 * Print Queue API Route
 *
 * GET  /api/production/print-queue  — retrieve queued print jobs
 * POST /api/production/print-queue  — trigger print queue processing
 *
 * Admin only.
 *
 * Requirements: 5.1, 5.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { validateAdminAccess } from '@/src/lib/auth/api-auth';
import { PrintQueueService } from '@/src/lib/production/print-queue';

// =============================================
// GET /api/production/print-queue
// =============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await validateAdminAccess();
    if (!auth.isValid) return auth.response;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);

    const supabase = await createClient();
    const service = new PrintQueueService(supabase);

    const result = await service.getPrintQueueItems(limit);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      print_queue: result.data,
      count: result.data?.length ?? 0,
    });
  } catch (err) {
    console.error('GET /api/production/print-queue unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// =============================================
// POST /api/production/print-queue
// =============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await validateAdminAccess();
    if (!auth.isValid) return auth.response;

    const body = await request.json().catch(() => ({}));
    const limit = Math.min(parseInt(body.limit ?? '50', 10), 200);

    const supabase = await createClient();
    const service = new PrintQueueService(supabase);

    const result = await service.processPrintQueue(limit);

    return NextResponse.json({
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (err) {
    console.error('POST /api/production/print-queue unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}