import { getCachedProduct } from '@/src/lib/cache/server-cache'
import { ProductPageProps } from './ProductDetailsPage'

export const revalidate = 300 // Revalidate every 5 minutes

export { default } from './ProductDetailsPage'

// Generate static params for popular products (optional)
export async function generateStaticParams() {
  try {
    // This would typically fetch popular product IDs
    // For now, return empty array to generate on-demand
    return []
  } catch (error) {
    console.error('Failed to generate static params:', error)
    return []
  }
}

// Metadata for SEO
export async function generateMetadata({ params }: ProductPageProps) {
  try {
    const { id } = await params
    const product = await getCachedProduct(id)
    
    if (!product) {
      return {
        title: 'Product Not Found | Sunlight',
        description: 'The requested product could not be found.',
      }
    }
    
    return {
      title: `${product.name} | Sunlight`,
      description: product.description || `Shop ${product.name} - Premium phone case with excellent protection and style.`,
      openGraph: {
        title: product.name,
        description: product.description,
        images: [product.image_url],
      },
    }
  } catch {
    return {
      title: 'Product | Sunlight',
      description: 'Premium phone cases with excellent protection and style.',
    }
  }
}