import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/src/lib/supabase/server'
import { ProductActions } from '@/src/components/products/ProductActions'

export interface PredesignedProductPageProps {
  params: Promise<{
    id: string
  }>
}

async function getPredesignedProduct(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('predesigned_products')
    .select(`
      id,
      name,
      description,
      price_override,
      is_featured,
      is_active,
      color_name,
      color_hex,
      design_image_url,
      variant_image_url,
      additional_image_urls,
      brand:brands!inner (
        id,
        name
      ),
      model:models!inner (
        id,
        name
      ),
      product_type:product_types!inner (
        id,
        name,
        base_price,
        description,
        material_properties
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  // Extract single objects from arrays (Supabase returns arrays for joins)
  const brand = Array.isArray(data.brand) ? data.brand[0] : data.brand
  const model = Array.isArray(data.model) ? data.model[0] : data.model
  const productType = Array.isArray(data.product_type) ? data.product_type[0] : data.product_type

  const basePrice = productType?.base_price || 0
  const finalPrice = data.price_override || basePrice

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    price: finalPrice,
    image_url: data.design_image_url || data.variant_image_url || 'https://via.placeholder.com/600x600?text=Phone+Case',
    additional_images: data.additional_image_urls || [],
    brand: brand,
    model: model,
    product_type: productType,
    color_name: data.color_name,
    color_hex: data.color_hex,
    is_featured: data.is_featured,
    in_stock: true,
    stock_quantity: 100,
  }
}

async function PredesignedProductDetails({ id }: { id: string }) {
  const product = await getPredesignedProduct(id)
  
  if (!product) {
    notFound()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Product Images */}
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No image available
            </div>
          )}
        </div>

        {/* Additional images */}
        {product.additional_images && product.additional_images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {product.additional_images.map((imgUrl: string, i: number) => (
              <div
                key={i}
                className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                <Image
                  src={imgUrl}
                  alt={`${product.name} view ${i + 2}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="space-y-6">
        {/* Title + price */}
        <div>
          {product.brand && product.model && (
            <p className="text-sm text-gray-500 mb-1">
              {product.brand.name} · {product.model.name}
            </p>
          )}
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <div className="flex items-baseline gap-3 mt-3">
            <span className="text-3xl font-bold text-green-600">
              ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </span>
          </div>
        </div>

        {/* Stock badge */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            In Stock
          </span>
          {product.is_featured && (
            <span className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-orange-50 text-orange-700 border border-orange-200">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Color */}
        {product.color_name && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Color</h3>
            <div className="flex items-center gap-2">
              {product.color_hex && (
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
                  style={{ backgroundColor: product.color_hex }}
                  aria-label={product.color_hex}
                />
              )}
              <span className="text-sm text-gray-700">{product.color_name}</span>
            </div>
          </div>
        )}

        {/* Add to cart */}
        <ProductActions 
          variantId={id} 
          designId={id}
          isPredesigned={true}
        />

        {/* Product details table */}
        <div className="border-t pt-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Product Details</h3>
          <dl className="space-y-3">
            {product.product_type && (
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium text-gray-900">{product.product_type.name}</dd>
              </div>
            )}
            {product.brand && (
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Brand</dt>
                <dd className="font-medium text-gray-900">{product.brand.name}</dd>
              </div>
            )}
            {product.model && (
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Compatible With</dt>
                <dd className="font-medium text-gray-900">{product.model.name}</dd>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Availability</dt>
              <dd className="font-medium text-green-700">In Stock</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default async function PredesignedProductPage({ params }: PredesignedProductPageProps) {
  const { id } = await params
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/predesigned" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
          ← Back to Predesigned Cases
        </a>
      </div>
      
      <Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-28 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      }>
        <PredesignedProductDetails id={id} />
      </Suspense>
    </div>
  )
}

// Metadata for SEO
export async function generateMetadata({ params }: PredesignedProductPageProps) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data } = await supabase
      .from('predesigned_products')
      .select('name, description')
      .eq('id', id)
      .single()
    
    if (!data) {
      return {
        title: 'Product Not Found | Sunlight',
        description: 'The requested product could not be found.',
      }
    }
    
    return {
      title: `${data.name} | Sunlight`,
      description: data.description || `Shop ${data.name} - Premium predesigned phone case.`,
      openGraph: {
        title: data.name,
        description: data.description,
      },
    }
  } catch {
    return {
      title: 'Predesigned Case | Sunlight',
      description: 'Premium predesigned phone cases.',
    }
  }
}

export const revalidate = 300 // Revalidate every 5 minutes
