import { getCategoriesForPage, ProductsPageProps } from './ProductsListPage'

export const revalidate = 300 // Revalidate every 5 minutes

export { default } from './ProductsListPage'

// Generate static params for popular categories
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