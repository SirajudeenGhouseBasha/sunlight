/**
 * Shopping Cart API Route
 *
 * GET    /api/cart  — get user's cart items
 * POST   /api/cart  — add item to cart (predesigned OR custom)
 * DELETE /api/cart  — clear entire cart
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import {
  calculatePredesignedPrice,
  calculateCustomPrice,
} from '@/src/lib/pricing/price-calculator';
import { validateProductType } from '@/src/utils/product-type-discriminator';

// =============================================
// GET /api/cart
// =============================================

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        variant:variants(
          *,
          model:models(id, name, slug, brand:brands(id, name, slug)),
          product_type:product_types(id, name, slug, base_price)
        ),
        design:designs(id, name, image_url, thumbnail_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch cart items' }, { status: 500 });
    }

    const subtotal = cartItems?.reduce(
      (sum, item) => sum + parseFloat(item.total_price.toString()), 0
    ) ?? 0;

    return NextResponse.json({
      cart_items: cartItems ?? [],
      summary: {
        subtotal: subtotal.toFixed(2),
        item_count: cartItems?.length ?? 0,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================
// POST /api/cart
// =============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      // Predesigned fields
      variant_id,
      design_id,
      // Custom fields
      model_id,
      product_type_id,
      custom_design_data,
      // Common
      quantity = 1,
      customization_options,
    } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Valid quantity is required' }, { status: 400 });
    }

    // Validate product type consistency
    const typeValidation = validateProductType({ design_id, custom_design_data });
    if (!typeValidation.is_valid) {
      return NextResponse.json(
        { error: typeValidation.errors.join(' ') },
        { status: 400 }
      );
    }

    const isPredesigned = design_id != null;

    let unitPrice: number;

    if (isPredesigned) {
      // ── Predesigned: needs variant_id ──────────────────────────────
      if (!variant_id) {
        return NextResponse.json(
          { error: 'variant_id is required for predesigned products' },
          { status: 400 }
        );
      }

      const { data: variant, error: variantError } = await supabase
        .from('variants')
        .select('*, product_type:product_types(base_price), predesigned_products(price_override)')
        .eq('id', variant_id)
        .single();

      if (variantError || !variant) {
        return NextResponse.json({ error: 'Invalid variant_id' }, { status: 400 });
      }

      // Check if there's a price_override from predesigned_products
      const priceOverride = variant.predesigned_products?.[0]?.price_override ?? null;

      unitPrice = calculatePredesignedPrice({
        base_price: parseFloat(variant.product_type.base_price),
        price_modifier: parseFloat(variant.price_modifier),
        price_override: priceOverride != null ? parseFloat(priceOverride) : null,
      });

      // Check for existing item
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('variant_id', variant_id)
        .eq('design_id', design_id)
        .maybeSingle();

      if (existing) {
        const newQty = existing.quantity + quantity;
        const { data: updated, error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQty, total_price: unitPrice * newQty, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select('*, variant:variants(*, model:models(id,name,slug,brand:brands(id,name,slug)), product_type:product_types(id,name,slug,base_price)), design:designs(id,name,image_url,thumbnail_url)')
          .single();

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
        }
        return NextResponse.json({ cart_item: updated });
      }

      const { data: cartItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          variant_id,
          design_id,
          quantity,
          unit_price: unitPrice,
          total_price: unitPrice * quantity,
          customization_options: customization_options ?? null,
        })
        .select('*, variant:variants(*, model:models(id,name,slug,brand:brands(id,name,slug)), product_type:product_types(id,name,slug,base_price)), design:designs(id,name,image_url,thumbnail_url)')
        .single();

      if (insertError) {
        return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
      }
      return NextResponse.json({ cart_item: cartItem }, { status: 201 });

    } else {
      // ── Custom: needs model_id + product_type_id + custom_design_data ──
      if (!model_id || !product_type_id || !custom_design_data) {
        return NextResponse.json(
          { error: 'model_id, product_type_id, and custom_design_data are required for custom products' },
          { status: 400 }
        );
      }

      const { data: productType, error: ptError } = await supabase
        .from('product_types')
        .select('base_price')
        .eq('id', product_type_id)
        .single();

      if (ptError || !productType) {
        return NextResponse.json({ error: 'Invalid product_type_id' }, { status: 400 });
      }

      unitPrice = calculateCustomPrice({
        base_price: parseFloat(productType.base_price),
        price_modifier: 0, // no variant modifier for custom products
      });

      const { data: cartItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          variant_id: null,
          design_id: null,
          model_id,
          product_type_id,
          custom_design_data,
          quantity,
          unit_price: unitPrice,
          total_price: unitPrice * quantity,
          customization_options: customization_options ?? null,
        })
        .select('*')
        .single();

      if (insertError) {
        return NextResponse.json({ error: 'Failed to add custom item to cart' }, { status: 500 });
      }
      return NextResponse.json({ cart_item: cartItem }, { status: 201 });
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================
// DELETE /api/cart
// =============================================

export async function DELETE(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Cart cleared successfully' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
