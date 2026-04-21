import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import { ProductGrid } from '@/src/components/optimized/ProductGrid'
import { ProductGridSkeleton } from '@/src/components/loading/ProductSkeleton'

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    page?: string
  }>
}

// This page uses ISR with revalidation
export const revalidate = 300 // Revalidate every 5 minutes

async function getProductsForPage(category?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('variants')
    .select(`
      id,
      name,
      color_name,
      image_url,
      model:models!inner(
        name,
        brand:brands!inner(name)
      ),
      product_type:product_types!inner(
        name,
        slug,
        base_price
      )
    `)
    .eq('is_active', true)
    .eq('model.is_active', true)
    .eq('model.brand.is_active', true)
    .eq('product_type.is_active', true)
    .order('created_at', { ascending: false })
    .limit(24)

  if (category) {
    query = query.eq('product_type.slug', category)
  }

  const { data, error } = await query
  if (error) {
    throw new Error('Failed to fetch products')
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    name: `${item.model.brand.name} ${item.model.name} ${item.color_name || ''}`.trim(),
    price: Number(item.product_type.base_price || 0),
    image_url: item.image_url || 'https://via.placeholder.com/600x600?text=Phone+Case',
    category: item.product_type.slug || item.product_type.name || 'cases',
  }))
}

async function getCategoriesForPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_types')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(20)

  if (error) {
    throw new Error('Failed to fetch categories')
  }

  return data || []
}

async function ProductList({ category }: { category?: string }) {
  const products = await getProductsForPage(category)
  return <ProductGrid products={products} />
}

async function CategoryFilter({ selectedCategory }: { selectedCategory?: string }) {
  const categories = await getCategoriesForPage()
  
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Categories</h2>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/products"
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            !selectedCategory
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Products
        </Link>
        {categories.map((category: { id: string; slug: string; name: string }) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              selectedCategory === category.slug
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category } = await searchParams
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {category ? `${category} Cases` : 'All Phone Cases'}
        </h1>
        <p className="text-gray-600">
          Discover our collection of high-quality phone cases
        </p>
      </div>
      
      <Suspense fallback={<div className="h-16 bg-gray-100 rounded animate-pulse mb-6" />}>
        <CategoryFilter selectedCategory={category} />
      </Suspense>
      
      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        <ProductList category={category} />
      </Suspense>
    </div>
  )
}

// Generate static params for popular categories (optional)
export async function generateStaticParams() {
  try {
    const categories = await getCategoriesForPage()
    
    return categories.slice(0, 5).map((category: { slug: string }) => ({
      category: category.slug,
    }))
  } catch (error) {
    console.error('Failed to generate static params:', error)
    return []
  }
}

// Metadata for SEO
export async function generateMetadata({ searchParams }: ProductsPageProps) {
  const { category } = await searchParams
  
  return {
    title: category ? `${category} Phone Cases | Sunlight` : 'Phone Cases | Sunlight',
    description: category 
      ? `Shop our collection of ${category} phone cases with premium quality and design.`
      : 'Shop our complete collection of phone cases for all devices with premium quality and design.',
  }
}