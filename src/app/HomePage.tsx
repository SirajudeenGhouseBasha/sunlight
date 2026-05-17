import { Suspense } from 'react';
import { createClient } from '@/src/lib/supabase/server';
import { HomePageClientAdvanced } from '@/src/components/home/HomePageClient';

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
        created_at,
        model:models!inner(
          id,
          name,
          slug,
          is_active,
          brand:brands!inner(
            id,
            name,
            slug,
            is_active
          )
        ),
        product_type:product_types!inner(
          id,
          name,
          slug,
          base_price,
          description,
          is_active
        )
      `)
      .eq('is_active', true)
      .eq('model.is_active', true)
      .eq('model.brand.is_active', true)
      .eq('product_type.is_active', true)
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(8),

    supabase
      .from('brands')
      .select(`
        id,
        name,
        slug,
        logo_url
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(6),

    supabase
      .from('product_types')
      .select(`
        id,
        name,
        slug,
        description
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(6),
  ]);

  if (featuredResult.error) {
    console.error('Featured products fetch error:', featuredResult.error);
  }

  if (brandsResult.error) {
    console.error('Brands fetch error:', brandsResult.error);
  }

  if (productTypesResult.error) {
    console.error('Product types fetch error:', productTypesResult.error);
  }

  const featuredProducts =
    featuredResult.data?.map((variant: any) => ({
      id: variant.id,
      variant_id: variant.id,
      slug:
        variant.slug ||
        `${variant.model.brand.slug}-${variant.model.slug}`,

      name: `${variant.model.brand.name} ${variant.model.name}`,

      brand: {
        id: variant.model.brand.id,
        name: variant.model.brand.name,
        slug: variant.model.brand.slug,
      },

      model: {
        id: variant.model.id,
        name: variant.model.name,
        slug: variant.model.slug,
      },

      product_type: {
        id: variant.product_type.id,
        name: variant.product_type.name,
        slug: variant.product_type.slug,
        description: variant.product_type.description,
      },

      color_name: variant.color_name,
      color_hex: variant.color_hex,

      price:
        Number(variant.product_type.base_price || 0) +
        Number(variant.price_modifier || 0),

      stock_quantity: variant.stock_quantity,
      in_stock: variant.stock_quantity > 0,

      href: `/products/${variant.model.brand.slug}/${variant.model.slug}`,
    })) || [];

  return {
    featuredProducts,
    brands: brandsResult.data || [],
    productTypes: productTypesResult.data || [],
  };
}

function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="animate-pulse">
        <div className="h-screen flex items-center px-6 lg:px-20">
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-20">
            <div className="space-y-6">
              <div className="h-4 w-40 bg-white/10 rounded" />
              <div className="h-24 w-full max-w-xl bg-white/10 rounded-2xl" />
              <div className="h-6 w-full max-w-lg bg-white/5 rounded" />
              <div className="flex gap-4">
                <div className="h-12 w-40 bg-white/10 rounded-xl" />
                <div className="h-12 w-40 bg-white/5 rounded-xl" />
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="w-[320px] h-[520px] rounded-[40px] bg-white/5 border border-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function HomePageContent() {
  const { featuredProducts, brands, productTypes } =
    await getHomePageData();

  return (
    <HomePageClientAdvanced
      featuredProducts={featuredProducts}
      brands={brands}
      productTypes={productTypes}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}