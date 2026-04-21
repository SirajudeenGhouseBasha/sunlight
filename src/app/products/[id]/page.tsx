import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getCachedProduct, getCachedRelatedProducts } from '@/src/lib/cache/server-cache'
import { ProductGrid } from '@/src/components/optimized/ProductGrid'
import { ProductGridSkeleton } from '@/src/components/loading/ProductSkeleton'
import { Button } from '@/src/components/ui/button'

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

// This page uses ISR with revalidation
export const revalidate = 300 // Revalidate every 5 minutes

async function ProductDetails({ id }: { id: string }) {
  try {
    const product = await getCachedProduct(id)
    
    if (!product) {
      notFound()
    }
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          
          {/* Additional images would go here */}
        </div>
        
        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-2xl font-bold text-green-600 mt-2">
              ${product.price.toFixed(2)}
            </p>
          </div>
          
          {product.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}
          
          {/* Variants would go here */}
          
          <div className="space-y-4">
            <Button size="lg" className="w-full">
              Add to Cart
            </Button>
            <Button variant="outline" size="lg" className="w-full">
              Buy Now
            </Button>
          </div>
          
          {/* Additional product details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Product Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Category</dt>
                <dd className="font-medium">{product.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Material</dt>
                <dd className="font-medium">Premium Silicone</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Compatibility</dt>
                <dd className="font-medium">Universal</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Failed to load product:', error)
    notFound()
  }
}

async function RelatedProducts({ productId }: { productId: string }) {
  try {
    const relatedProducts = await getCachedRelatedProducts(productId)
    
    if (!relatedProducts || relatedProducts.length === 0) {
      return null
    }
    
    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
        <ProductGrid products={relatedProducts} />
      </div>
    )
  } catch (error) {
    console.error('Failed to load related products:', error)
    return null
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      }>
        <ProductDetails id={id} />
      </Suspense>
      
      <Suspense fallback={
        <div className="mt-16">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-6" />
          <ProductGridSkeleton count={4} />
        </div>
      }>
        <RelatedProducts productId={id} />
      </Suspense>
    </div>
  )
}

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