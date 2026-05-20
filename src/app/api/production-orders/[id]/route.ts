/**
 * Single Production Order API
 *
 * GET /api/production-orders/[id] — fetch one production order (admin only)
 *
 * Requirements: 4.4, 10.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { validateAdminAccess } from '@/src/lib/auth/api-auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateAdminAccess();
    if (!auth.isValid) return auth.response;

    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('production_orders')
      .select(`
        *,
        order:orders(id, order_number, status, total_amount, created_at, user_id),
        order_item:order_items(
          id, quantity, unit_price, total_price,
          product_name, variant_name, design_name,
          design_id, custom_design_data, model_id, product_type_id
        ),
        variant:variants(
          id, name, color_name, color_hex, image_url,
          model:models(id, name, slug),
          product_type:product_types(id, name, slug)
        ),
        design:designs(id, name, image_url, thumbnail_url)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: `Production order "${id}" not found.` }, { status: 404 });
    }

    return NextResponse.json({ production_order: data });
  } catch (err) {
    console.error('GET /api/production-orders/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
