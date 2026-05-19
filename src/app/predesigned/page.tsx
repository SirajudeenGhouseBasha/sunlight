import { Suspense } from 'react'
import { createClient } from '@/src/lib/supabase/server'
import { PredesignedGrid } from '@/src/components/predesigned/PredesignedGrid'
import { PredesignedGridSkeleton } from '@/src/components/loading/PredesignedSkeleton'

export interface PredesignedPageProps {
  searchParams: Promise<{
    featured?: string
    brand?: string
    category?: string
    page?: string
  }>
}

async function getPredesignedProducts(featured?: string, brand?: string, category?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('predesigned_products')
    .select(`
      id,
      name,
      description,
      price_override,
      is_featured,
      final_price:price_override,
      variant:variants (
        id,
        color_name,
        color_hex,
        price_modifier,
        stock_quantity,
        image_url,
        product_type:product_types (
          id,
          name,
          base_price
        ),
        model:models (
          id,
          name,
          brand:brands (
            id,
            name
          )
        )
      ),
      design:designs (
        id,
        name,
        description,
        image_url,
        thumbnail_url,
        category,
        tags
      )
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(24)

  if (featured === 'true') {
    query = query.eq('is_featured', true)
  }

  const { data, error } = await query
  if (error) {
    console.error('Failed to fetch predesigned products:', error)
    throw new Error('Failed to fetch predesigned products')
  }

  // Calculate final prices and format data
  return (data || []).map((item: any) => {
    const basePrice = item.variant?.product_type?.base_price || 0
    const priceModifier = item.variant?.price_modifier || 0
    const variantPrice = basePrice + priceModifier
    const finalPrice = item.price_override || variantPrice

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: finalPrice,
      image_url: item.design?.image_url || item.design?.thumbnail_url || item.variant?.image_url || 'https://via.placeholder.com/600x600?text=Phone+Case',
      brand: item.variant?.model?.brand?.name || 'Unknown',
      model: item.variant?.model?.name || 'Unknown',
      color: item.variant?.color_name || 'Default',
      color_hex: item.variant?.color_hex,
      category: item.design?.category || 'general',
      tags: item.design?.tags || [],
      is_featured: item.is_featured,
      variant_id: item.variant?.id,
      design_id: item.design?.id,
      stock_quantity: item.variant?.stock_quantity || 0,
      in_stock: (item.variant?.stock_quantity || 0) > 0,
    }
  })
}

async function getBrandsForFilter() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to fetch brands:', error)
    return []
  }

  return data || []
}

async function PredesignedList({ featured, brand, category }: { 
  featured?: string
  brand?: string 
  category?: string 
}) {
  const products = await getPredesignedProducts(featured, brand, category)
  return <PredesignedGrid products={products} />
}

async function FilterSection({ selectedBrand, selectedCategory, isFeatured }: { 
  selectedBrand?: string
  selectedCategory?: string
  isFeatured?: boolean
}) {
  const brands = await getBrandsForFilter()
  
  const categories = [
    'abstract',
    'nature',
    'geometric',
    'floral',
    'minimal',
    'artistic',
    'vintage',
    'modern'
  ]
  
  return (
    <div className="mb-8 space-y-6">
      {/* Featured Toggle */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Collections</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href="/predesigned"
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              !isFeatured
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Designs
          </a>
          <a
            href="/predesigned?featured=true"
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              isFeatured
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Featured
          </a>
        </div>
      </div>

      {/* Brand Filter */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Brands</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href="/predesigned"
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              !selectedBrand
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Brands
          </a>
          {brands.map((brand: { id: string; slug: string; name: string }) => (
            <a
              key={brand.id}
              href={`/predesigned?brand=${brand.slug}`}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedBrand === brand.slug
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {brand.name}
            </a>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href="/predesigned"
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              !selectedCategory
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Categories
          </a>
          {categories.map((category) => (
            <a
              key={category}
              href={`/predesigned?category=${category}`}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function PredesignedPage({ searchParams }: PredesignedPageProps) {
  const { featured, brand, category } = await searchParams
  const isFeatured = featured === 'true'
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {isFeatured ? 'Featured Designs' : 'Predesigned Cases'}
            </h1>
            <p className="text-lg text-gray-600">
              {isFeatured 
                ? 'Our handpicked collection of the most popular and stunning designs'
                : 'Discover our curated collection of professionally designed phone cases, ready to order instantly'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<div className="h-32 bg-gray-100 rounded animate-pulse mb-8" />}>
          <FilterSection 
            selectedBrand={brand} 
            selectedCategory={category}
            isFeatured={isFeatured}
          />
        </Suspense>
        
        <Suspense fallback={<PredesignedGridSkeleton count={12} />}>
          <PredesignedList featured={featured} brand={brand} category={category} />
        </Suspense>
      </div>
    </div>
  )
}

// Metadata for SEO
export async function generateMetadata({ searchParams }: PredesignedPageProps) {
  const { featured, brand, category } = await searchParams
  
  let title = 'Predesigned Phone Cases | Sunlight'
  let description = 'Shop our curated collection of predesigned phone cases with stunning artwork and professional designs.'
  
  if (featured === 'true') {
    title = 'Featured Phone Case Designs | Sunlight'
    description = 'Discover our handpicked collection of the most popular and beautiful phone case designs.'
  } else if (brand) {
    title = `${brand} Predesigned Cases | Sunlight`
    description = `Shop predesigned phone cases for ${brand} devices with premium quality and stunning designs.`
  } else if (category) {
    title = `${category} Phone Case Designs | Sunlight`
    description = `Browse our ${category} collection of predesigned phone cases with unique artwork.`
  }
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

export const revalidate = 300 // Revalidate every 5 minutes