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
        design:designs(id, name, image_url, thumbnail_url),
        model:models(id, name, slug, brand:brands(id, name, slug)),
        product_type:product_types(id, name, slug, base_price)
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
      predesigned_product_id,
      // Custom fields
      model_id,
      product_type_id,
      custom_design_data,
      // Common
      quantity = 1,
      customization_options,
    } = body;

    // Support predesigned_product_id as an alias for design_id (legacy linked rows)
    const resolvedDesignId = design_id || undefined;

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Valid quantity is required' }, { status: 400 });
    }

    const hasDesign = resolvedDesignId != null && resolvedDesignId !== '';
    const hasCustomData = custom_design_data != null;

    if (hasDesign && hasCustomData) {
      return NextResponse.json(
        { error: 'Item cannot have both design_id and custom_design_data' },
        { status: 400 }
      );
    }

    let unitPrice: number;

    // ── Case 0: Decoupled predesigned — no variant, no design ─────────────
    if (predesigned_product_id) {
      const { data: product, error: productError } = await supabase
        .from('predesigned_products')
        .select(`
          *,
          model:models(id, name, slug, brand:brands(id, name, slug)),
          product_type:product_types(id, name, base_price)
        `)
        .eq('id', predesigned_product_id)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { error: 'Invalid predesigned_product_id' },
          { status: 400 }
        );
      }

      const basePrice = product.product_type?.base_price
        ? parseFloat(product.product_type.base_price)
        : 0;
      unitPrice = product.price_override != null
        ? parseFloat(product.price_override)
        : basePrice;

      const itemSelect = `
        *,
        variant:variants(
          *,
          model:models(id, name, slug, brand:brands(id, name, slug)),
          product_type:product_types(id, name, slug, base_price)
        ),
        design:designs(id, name, image_url, thumbnail_url),
        model:models(id, name, slug, brand:brands(id, name, slug)),
        product_type:product_types(id, name, base_price)
      `;

      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .is('variant_id', null)
        .is('design_id', null)
        .eq('model_id', product.model_id)
        .eq('product_type_id', product.product_type_id)
        .maybeSingle();

      if (existing) {
        const newQty = existing.quantity + quantity;
        const { data: updated, error: updateError } = await supabase
          .from('cart_items')
          .update({
            quantity: newQty,
            total_price: unitPrice * newQty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select(itemSelect)
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
          variant_id: null,
          design_id: null,
          model_id: product.model_id,
          product_type_id: product.product_type_id,
          quantity,
          unit_price: unitPrice,
          total_price: unitPrice * quantity,
          customization_options: customization_options ?? null,
        })
        .select(itemSelect)
        .single();

      if (insertError) {
        return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
      }
      return NextResponse.json({ cart_item: cartItem }, { status: 201 });
    }

    // ── Case 1: Predesigned — variant + design ───────────────────────────
    if (hasDesign) {
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

      const priceOverride = variant.predesigned_products?.[0]?.price_override ?? null;

      unitPrice = calculatePredesignedPrice({
        base_price: parseFloat(variant.product_type.base_price),
        price_modifier: parseFloat(variant.price_modifier),
        price_override: priceOverride != null ? parseFloat(priceOverride) : null,
      });

      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('variant_id', variant_id)
        .eq('design_id', resolvedDesignId)
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
          design_id: resolvedDesignId,
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
    }

    // ── Case 2: Custom — model + product type + custom design data ────────
    if (hasCustomData) {
      if (!model_id || !product_type_id) {
        return NextResponse.json(
          { error: 'model_id and product_type_id are required for custom products' },
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
        price_modifier: 0,
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

    // ── Case 3: Plain variant — no design, no custom data ─────────────────
    if (!variant_id) {
      return NextResponse.json(
        { error: 'variant_id is required' },
        { status: 400 }
      );
    }

    const { data: variant, error: variantError } = await supabase
      .from('variants')
      .select('*, product_type:product_types(base_price)')
      .eq('id', variant_id)
      .single();

    if (variantError || !variant) {
      return NextResponse.json({ error: 'Invalid variant_id' }, { status: 400 });
    }

    unitPrice = calculatePredesignedPrice({
      base_price: parseFloat(variant.product_type.base_price),
      price_modifier: parseFloat(variant.price_modifier),
      price_override: null,
    });

    // Custom design elements added on a base variant (CustomizationEditor flow).
    // Store them as custom_design_data (with model + product type from the
    // variant) so the design survives cart → order_items and satisfies the
    // custom-item schema constraints.
    const customElements = customization_options as { elements?: unknown[] } | null;
    const hasCustomElements =
      !!customElements && Array.isArray(customElements.elements) && customElements.elements.length > 0;

    if (hasCustomElements) {
      const serializedDesign = JSON.stringify(customization_options);

      const { data: existingList } = await supabase
        .from('cart_items')
        .select('id, quantity, custom_design_data')
        .eq('user_id', user.id)
        .eq('variant_id', variant_id)
        .not('custom_design_data', 'is', null);

      // Two different designs on the same variant are distinct cart items,
      // so dedupe by the serialized design, not by variant alone.
      const existing = (existingList ?? []).find(
        (row) => JSON.stringify(row.custom_design_data) === serializedDesign
      );

      if (existing) {
        const newQty = existing.quantity + quantity;
        const { data: updated, error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQty, total_price: unitPrice * newQty, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select('*, variant:variants(*, model:models(id,name,slug,brand:brands(id,name,slug)), product_type:product_types(id,name,slug,base_price))')
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
          design_id: null,
          model_id: variant.model_id,
          product_type_id: variant.product_type_id,
          custom_design_data: customization_options,
          customization_options: customization_options ?? null,
          quantity,
          unit_price: unitPrice,
          total_price: unitPrice * quantity,
        })
        .select('*, variant:variants(*, model:models(id,name,slug,brand:brands(id,name,slug)), product_type:product_types(id,name,slug,base_price))')
        .single();

      if (insertError) {
        console.error('[Cart] Failed to insert custom variant:', insertError);
        return NextResponse.json({ error: 'Failed to add custom item to cart' }, { status: 500 });
      }
      return NextResponse.json({ cart_item: cartItem }, { status: 201 });
    }

    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('variant_id', variant_id)
      .is('design_id', null)
      .maybeSingle();

    if (existing) {
      const newQty = existing.quantity + quantity;
      const { data: updated, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQty, total_price: unitPrice * newQty, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('*, variant:variants(*, model:models(id,name,slug,brand:brands(id,name,slug)), product_type:product_types(id,name,slug,base_price))')
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
        design_id: null,
        quantity,
        unit_price: unitPrice,
        total_price: unitPrice * quantity,
        customization_options: customization_options ?? null,
      })
      .select('*, variant:variants(*, model:models(id,name,slug,brand:brands(id,name,slug)), product_type:product_types(id,name,slug,base_price))')
      .single();

    if (insertError) {
      console.error('[Cart] Failed to insert plain variant:', insertError);
      return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
    }
    return NextResponse.json({ cart_item: cartItem }, { status: 201 });
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
