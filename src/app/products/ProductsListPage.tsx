import { ProductListingClient } from '@/src/components/products/ProductListingClient'

export interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    page?: string
  }>
}

export async function getCategoriesForPage() {
  // Kept for generateStaticParams in page.tsx
  const { createClient } = await import('@/src/lib/supabase/server')
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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category } = await searchParams

  return <ProductListingClient initialCategory={category} />
}
