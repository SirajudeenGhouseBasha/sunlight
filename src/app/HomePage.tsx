import { createClient } from '@/src/lib/supabase/server';
import { HomePageClient } from '@/src/components/home/HomePageClient';

async function getHomePageData() {
  const supabase = await createClient();

  const [featuredResult, brandsResult, productTypesResult] = await Promise.all([
    supabase
      .from('variants')
      .select(`
        id,
        color_name,
        color_hex,
        price_modifier,
        stock_quantity,
        is_active,
        model:models!inner(
          name,
          brand:brands!inner(
            name
          )
        ),
        product_type:product_types!inner(
          name,
          base_price
        )
      `)
      .eq('is_active', true)
      .eq('model.is_active', true)
      .eq('model.brand.is_active', true)
      .eq('product_type.is_active', true)
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('brands')
      .select('id, name, slug, logo_url')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(6),
    supabase
      .from('product_types')
      .select('id, name, slug, description')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(6),
  ]);

  const featuredProducts = (featuredResult.data || []).map((variant: any) => ({
    id: variant.id,
    variant_id: variant.id,
    name: `${variant.model.brand.name} ${variant.model.name}`,
    product_type: variant.product_type.name,
    color_name: variant.color_name,
    color_hex: variant.color_hex,
    price: variant.product_type.base_price + variant.price_modifier,
    in_stock: variant.stock_quantity > 0,
  }));

  return {
    featuredProducts,
    brands: brandsResult.data || [],
    productTypes: productTypesResult.data || [],
  };
}

export default async function HomePage() {
  const { featuredProducts, brands, productTypes } = await getHomePageData();

  return (
    <HomePageClient
      featuredProducts={featuredProducts}
      brands={brands}
      productTypes={productTypes}
    />
  );
}
