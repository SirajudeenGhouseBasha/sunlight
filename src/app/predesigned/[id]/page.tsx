import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/src/lib/supabase/server'
import { ProductActions } from '@/src/components/products/ProductActions'
import { ChevronRight, Star, ShieldCheck, Truck, RotateCcw } from 'lucide-react'

export const dynamic = 'force-dynamic'

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
      brand:brands!inner (id, name),
      model:models!inner (id, name),
      product_type:product_types!inner (id, name, base_price, description, material_properties)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error || !data) return null

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
  
  if (!product) notFound()

  const brandName = product.brand?.name
  const modelName = product.model?.name
  const productTypeName = product.product_type?.name
  const totalPrice = product.price
  const mrp = totalPrice * 1.2
  const discountPercent = Math.round(((mrp - totalPrice) / mrp) * 100)
  const allImages = [product.image_url, ...(product.additional_images || [])].filter(Boolean)

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap pb-1">
        <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <Link href="/predesigned" className="hover:text-orange-600 transition-colors">Predesigned</Link>
        {brandName && (
          <>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-gray-400 truncate max-w-[120px]">{product.name}</span>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Images */}
        <div className="space-y-3 sm:space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100 group">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No image available
              </div>
            )}
            {discountPercent > 0 && (
              <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                -{discountPercent}%
              </span>
            )}
            {product.is_featured && (
              <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                Featured
              </span>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {allImages.map((imgUrl: string, i: number) => (
                <div
                  key={i}
                  className={`relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === 0 ? 'border-orange-500' : 'border-gray-200 hover:border-gray-400'
                  } bg-gray-50 cursor-pointer`}
                >
                  <Image src={imgUrl} alt={`${product.name} view ${i + 1}`} fill className="object-cover" sizes="64px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4 sm:space-y-5">
          <div>
            {brandName && (
              <p className="text-xs sm:text-sm font-medium text-orange-600 uppercase tracking-wider mb-1">
                {brandName}
              </p>
            )}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            {modelName && (
              <p className="text-sm text-gray-500 mt-1">Compatible with {modelName}</p>
            )}
          </div>

          {/* Ratings */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-green-700 text-white text-xs font-semibold px-2 py-0.5 rounded">
              <span>4.5</span>
              <Star className="w-3 h-3 fill-white" />
            </div>
            <span className="text-xs sm:text-sm text-gray-500">86 Ratings & 28 Reviews</span>
          </div>

          {/* Price */}
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                ₹{typeof totalPrice === 'number' ? totalPrice.toFixed(2) : totalPrice}
              </span>
              {mrp > totalPrice && (
                <>
                  <span className="text-base sm:text-lg text-gray-400 line-through">₹{mrp.toFixed(2)}</span>
                  <span className="text-sm font-semibold text-green-600">{discountPercent}% off</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">Inclusive of all taxes</p>
          </div>

          {/* Stock */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-50 text-green-700 border border-green-200">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />
              In Stock
            </span>
          </div>

          {/* Color */}
          {product.color_name && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Color:</span>
              <div className="flex items-center gap-2">
                {product.color_hex && (
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-sm ring-2 ring-orange-500 cursor-pointer"
                    style={{ backgroundColor: product.color_hex }}
                  />
                )}
                <span className="text-sm text-gray-900 font-medium">{product.color_name}</span>
              </div>
            </div>
          )}

          {/* Highlights */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Highlights</h3>
            <ul className="space-y-1.5">
              {[
                `Premium print quality for ${modelName || 'your device'}`,
                `${productTypeName || 'Premium'} material with durable finish`,
                'Scratch-resistant and shock-absorbent',
                'Vibrant colors that won\'t fade',
                'Tailored fit with easy access to all ports',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                  <span className="text-green-600 mt-0.5 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Description</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Seller Services */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>1 Year Warranty</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-green-600" />
              <span>Free Delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-green-600" />
              <span>7 Days Return</span>
            </div>
          </div>

          {/* Add to cart */}
          <div className="pt-2 hidden lg:block">
            <ProductActions variantId={id} designId={id} isPredesigned={true} predesignedProductId={id} />
          </div>

          {/* Product Details */}
          <div className="border-t border-gray-200 pt-4 sm:pt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Product Details</h3>
            <dl className="space-y-2.5">
              {productTypeName && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                  <dt className="text-gray-500">Type</dt>
                  <dd className="font-medium text-gray-900 sm:col-span-2">{productTypeName}</dd>
                </div>
              )}
              {modelName && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                  <dt className="text-gray-500">Compatible Model</dt>
                  <dd className="font-medium text-gray-900 sm:col-span-2">{modelName}</dd>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                <dt className="text-gray-500">Availability</dt>
                <dd className="font-medium text-green-700 sm:col-span-2">In Stock</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3 lg:hidden">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="shrink-0">
            <p className="text-lg font-bold text-gray-900">₹{typeof totalPrice === 'number' ? totalPrice.toFixed(2) : totalPrice}</p>
            {mrp > totalPrice && <p className="text-xs text-gray-500 line-through">₹{mrp.toFixed(2)}</p>}
          </div>
          <div className="flex-1">
            <ProductActions variantId={id} designId={id} isPredesigned={true} predesignedProductId={id} compact />
          </div>
        </div>
      </div>
      <div className="h-24 lg:hidden" />
    </>
  )
}

export default async function PredesignedProductPage({ params }: PredesignedProductPageProps) {
  const { id } = await params
  
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
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
