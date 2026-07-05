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
        model_id,
        product_type_id
      `)
      .eq('is_active', true)
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
        description,
        base_price
      `)
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);

  let modelsMap: Record<string, any> = {};
  let brandsMap: Record<string, any> = {};

  if (featuredResult.data && featuredResult.data.length > 0) {
    const modelIds = [...new Set((featuredResult.data as any[]).map(v => v.model_id))];

    const modelsResult = await supabase
      .from('models')
      .select(`
        id,
        name,
        slug,
        brand_id
      `)
      .in('id', modelIds);

    if (modelsResult.data) {
      modelsMap = Object.fromEntries(
        modelsResult.data.map(m => [m.id, m])
      );

      const brandIds = [...new Set(modelsResult.data.map(m => m.brand_id))];

      const brandsForModelsResult = await supabase
        .from('brands')
        .select(`
          id,
          name,
          slug
        `)
        .in('id', brandIds);

      if (brandsForModelsResult.data) {
        brandsMap = Object.fromEntries(
          brandsForModelsResult.data.map(b => [b.id, b])
        );
      }
    }
  }

  if (featuredResult.error) {
    console.error('Featured products fetch error:', featuredResult.error);
  }

  if (brandsResult.error) {
    console.error('Brands fetch error:', brandsResult.error);
  }

  if (productTypesResult.error) {
    console.error('Product types fetch error:', productTypesResult.error);
  }

  const productTypesMap: Record<string, any> = {};

  if (productTypesResult.data) {
    productTypesResult.data.forEach(pt => {
      productTypesMap[pt.id] = pt;
    });
  }

  const featuredProducts =
    featuredResult.data?.map((variant: any) => {
      const model = modelsMap[variant.model_id];
      const brand = model ? brandsMap[model.brand_id] : null;
      const productType = productTypesMap[variant.product_type_id];

      return {
        id: variant.id,
        variant_id: variant.id,

        slug:
          variant.slug ||
          `${brand?.slug || 'unknown'}-${model?.slug || 'unknown'}`,

        name: `${brand?.name || 'Unknown'} ${model?.name || 'Model'}`,

        brand: {
          id: brand?.id || '',
          name: brand?.name || 'Unknown',
          slug: brand?.slug || '',
        },

        model: {
          id: model?.id || '',
          name: model?.name || 'Unknown',
          slug: model?.slug || '',
        },

        product_type: {
          id: productType?.id || '',
          name: productType?.name || 'Unknown',
          slug: productType?.slug || '',
          description: productType?.description || '',
        },

        color_name: variant.color_name,
        color_hex: variant.color_hex,

        price:
          Number(productType?.base_price || 0) +
          Number(variant.price_modifier || 0),

        stock_quantity: variant.stock_quantity,
        in_stock: variant.stock_quantity > 0,

        href: `/products/${brand?.slug || 'unknown'}/${model?.slug || 'unknown'}`,
      };
    }) || [];

  return {
    featuredProducts,
    brands: brandsResult.data || [],
    productTypes: productTypesResult.data || [],
  };
}

function HomePageSkeleton() {
  return (
    <div className="sunlight-atmosphere min-h-screen text-black">
      <div className="sunlight-atmosphere__content">
        <div className="animate-pulse">
          <div className="h-screen flex items-center px-6 lg:px-20">
            <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-20">
              
              <div className="space-y-6">
                <div className="h-4 w-40 rounded bg-black/5" />

                <div className="h-24 w-full max-w-xl rounded-2xl bg-black/5" />

                <div className="h-6 w-full max-w-lg rounded bg-black/[0.04]" />

                <div className="flex gap-4">
                  <div className="h-12 w-40 rounded-xl bg-black/5" />
                  <div className="h-12 w-40 rounded-xl bg-black/[0.04]" />
                </div>
              </div>

              <div className="hidden lg:flex items-center justify-center">
                <div className="w-[320px] h-[520px] rounded-[40px] border border-black/[0.04] bg-white/20 backdrop-blur-xl" />
              </div>

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
    <div className="sunlight-atmosphere">
      <div className="sunlight-atmosphere__content">
        <HomePageClientAdvanced
          featuredProducts={featuredProducts}
          brands={brands}
          productTypes={productTypes}
        />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}