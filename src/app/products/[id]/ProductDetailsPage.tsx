import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getCachedProduct, getCachedRelatedProducts } from '@/src/lib/cache/server-cache'
import { ProductGrid } from '@/src/components/optimized/ProductGrid'
import { ProductGridSkeleton } from '@/src/components/loading/ProductSkeleton'
import { ProductActions } from '@/src/components/products/ProductActions'
import { CustomizationEditorWrapper } from '@/src/components/products/CustomizationEditorWrapper'

export interface ProductPageProps {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    customize?: string
  }>
}

async function ProductDetails({ id, isCustomizing }: { id: string; isCustomizing: boolean }) {
  try {
    const result = await getCachedProduct(id)
    const product = result?.product || result
    
    if (!product) {
      notFound()
    }
    
    if (isCustomizing) {
      return (
        <div className="space-y-6">
          {/* Back link */}
          <div className="flex items-center gap-4">
            <a href="/custom-case" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
              ← Back to device selection
            </a>
          </div>

          {/* Customization editor */}
          <CustomizationEditorWrapper
            variantId={product.id}
            caseImageUrl={product.image_url}
            maskImageUrl={product.mask_image_url || undefined}
            productName={product.name}
          />

          {/* Product info below editor */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h2>
            {product.description && (
              <p className="text-gray-600 text-sm">{product.description}</p>
            )}
            <p className="text-2xl font-bold text-green-600 mt-3">
              ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </p>
          </div>
        </div>
      )
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
              ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </p>
          </div>
          
          {product.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}
          
          {/* Variants would go here */}
          
          <ProductActions variantId={id} />
          
          {/* Additional product details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Product Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Category</dt>
                <dd className="font-medium">{product.category || product.product_type?.name || 'Cases'}</dd>
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

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const isCustomizing = resolvedSearchParams.customize === 'true'
  
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
        <ProductDetails id={id} isCustomizing={isCustomizing} />
      </Suspense>
      
      {!isCustomizing && (
        <Suspense fallback={
          <div className="mt-16">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-6" />
            <ProductGridSkeleton count={4} />
          </div>
        }>
          <RelatedProducts productId={id} />
        </Suspense>
      )}
    </div>
  )
}
