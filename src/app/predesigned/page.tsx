import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import { PredesignedGrid } from '@/src/components/predesigned/PredesignedGrid'
import { PredesignedGridSkeleton } from '@/src/components/loading/PredesignedSkeleton'

export interface PredesignedPageProps {
  searchParams: Promise<{
    featured?: string
    brand?: string
    category?: string
    type?: string
    page?: string
  }>
}

async function getProductTypeBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('product_types')
    .select('id, name, slug')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data
}

async function getPredesignedProducts(featured?: string, brand?: string, category?: string, type?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('predesigned_products')
    .select(`
      id,
      name,
      description,
      price_override,
      is_featured,
      brand_id,
      model_id,
      product_type_id,
      color_name,
      color_hex,
      design_image_url,
      variant_image_url,
      brand:brands (
        id,
        name
      ),
      model:models (
        id,
        name
      ),
      product_type:product_types (
        id,
        name,
        base_price
      )
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(24)

  if (featured === 'true') {
    query = query.eq('is_featured', true)
  }

  if (type) {
    const productType = await getProductTypeBySlug(type)
    if (productType) {
      query = query.eq('product_type_id', productType.id)
    }
  }

  const { data, error } = await query
  if (error) {
    console.error('Failed to fetch predesigned products:', error)
    throw new Error('Failed to fetch predesigned products')
  }

  return (data || []).map((item: any) => {
    const basePrice = item.product_type?.base_price || 0
    const finalPrice = item.price_override || basePrice

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: finalPrice,
      image_url: item.design_image_url || item.variant_image_url || 'https://via.placeholder.com/600x600?text=Phone+Case',
      brand: item.brand?.name || 'Unknown',
      model: item.model?.name || 'Unknown',
      color: item.color_name || 'Default',
      color_hex: item.color_hex,
      category: 'predesigned',
      tags: [],
      is_featured: item.is_featured,
      stock_quantity: 100,
      in_stock: true,
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

async function PredesignedList({ featured, brand, category, type }: {
  featured?: string
  brand?: string
  category?: string
  type?: string
}) {
  const products = await getPredesignedProducts(featured, brand, category, type)
  return <PredesignedGrid products={products} />
}

async function FilterSection({ selectedBrand, selectedCategory, isFeatured, selectedType }: {
  selectedBrand?: string
  selectedCategory?: string
  isFeatured?: boolean
  selectedType?: string
}) {
  const brands = await getBrandsForFilter()
  let activeTypeName = ''
  if (selectedType) {
    const pt = await getProductTypeBySlug(selectedType)
    activeTypeName = pt?.name || ''
  }

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
      {activeTypeName && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filtered by:</span>
          <Link
            href="/predesigned"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium hover:bg-orange-200 transition-colors"
          >
            {activeTypeName}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>
      )}

      {/* Featured Toggle */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Collections</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/predesigned"
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              !isFeatured && !selectedType
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Designs
          </Link>
          <Link
            href="/predesigned?featured=true"
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              isFeatured
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Featured
          </Link>
        </div>
      </div>

      {/* Brand Filter */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Brands</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/predesigned"
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              !selectedBrand
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Brands
          </Link>
          {brands.map((brand: { id: string; slug: string; name: string }) => (
            <Link
              key={brand.id}
              href={`/predesigned?brand=${brand.slug}`}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedBrand === brand.slug
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {brand.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function PredesignedPage({ searchParams }: PredesignedPageProps) {
  const { featured, brand, category, type } = await searchParams
  const isFeatured = featured === 'true'
  let activeTypeName = ''
  if (type) {
    const pt = await getProductTypeBySlug(type)
    activeTypeName = pt?.name || ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {activeTypeName
                ? `${activeTypeName} Cases`
                : isFeatured
                  ? 'Featured Designs'
                  : 'Predesigned Cases'}
            </h1>
            <p className="text-lg text-gray-600">
              {activeTypeName
                ? `Browse our collection of ${activeTypeName.toLowerCase()} predesigned phone cases`
                : isFeatured
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
            selectedType={type}
          />
        </Suspense>

        <Suspense fallback={<PredesignedGridSkeleton count={12} />}>
          <PredesignedList featured={featured} brand={brand} category={category} type={type} />
        </Suspense>
      </div>
    </div>
  )
}

// Metadata for SEO
export async function generateMetadata({ searchParams }: PredesignedPageProps) {
  const { featured, brand, category, type } = await searchParams

  let title = 'Predesigned Phone Cases | Sunlight'
  let description = 'Shop our curated collection of predesigned phone cases with stunning artwork and professional designs.'

  if (type) {
    const pt = await getProductTypeBySlug(type)
    const typeName = pt?.name || type
    title = `${typeName} Predesigned Cases | Sunlight`
    description = `Shop our collection of ${typeName.toLowerCase()} predesigned phone cases with premium quality and stunning designs.`
  } else if (featured === 'true') {
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

export const revalidate = 300
