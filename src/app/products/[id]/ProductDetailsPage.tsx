import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/src/lib/supabase/server'
import { ProductGrid } from '@/src/components/optimized/ProductGrid'
import { ProductGridSkeleton } from '@/src/components/loading/ProductSkeleton'
import { ProductActions } from '@/src/components/products/ProductActions'
import { CustomizationEditorWrapper } from '@/src/components/products/CustomizationEditorWrapper'
import { toProxiedUrl } from '@/src/utils/image-url'
import { ChevronRight, ShieldCheck, Truck, RotateCcw, Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

export interface ProductPageProps {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    customize?: string
  }>
}

async function getProduct(id: string) {
  try {
    const supabase = await createClient()
    
    const { data: variant, error } = await supabase
      .from('variants')
      .select(`
        id,
        name,
        color_name,
        color_hex,
        price_modifier,
        stock_quantity,
        is_active,
        image_url,
        mask_image_url,
        additional_images,
        created_at,
        model:models!inner (
          id,
          name,
          slug,
          model_number,
          screen_size,
          mockup_template_url,
          brand:brands!inner (
            id,
            name,
            slug,
            logo_url
          )
        ),
        product_type:product_types!inner (
          id,
          name,
          slug,
          base_price,
          description,
          material_properties
        )
      `)
      .eq('id', id)
      .single()
    
    if (error || !variant) return null
    
    const model = Array.isArray(variant.model) ? variant.model[0] : variant.model
    const brand = model && (Array.isArray(model.brand) ? model.brand[0] : model.brand)
    const productType = Array.isArray(variant.product_type) ? variant.product_type[0] : variant.product_type
    
    if (!model || !brand || !productType) return null
    
    const brandData = brand as { id: any; name: any; slug: any; logo_url: any }
    const modelData = model as { id: any; name: any; slug: any; model_number: any; screen_size: any; mockup_template_url: any }
    const productTypeData = productType as { id: any; name: any; slug: any; base_price: any; description: any; material_properties: any }
    
    const basePrice = parseFloat(String(productTypeData.base_price))
    const modifier = parseFloat(String(variant.price_modifier))
    
    return {
      id: variant.id,
      variant_id: variant.id,
      name: `${brandData.name} ${modelData.name}`,
      brand: brandData,
      model: modelData,
      product_type: productTypeData,
      color_name: variant.color_name,
      color_hex: variant.color_hex,
      price: basePrice + modifier,
      base_price: basePrice,
      price_modifier: modifier,
      stock_quantity: variant.stock_quantity,
      in_stock: variant.stock_quantity > 0,
      is_active: variant.is_active,
      image_url: variant.image_url,
      mask_image_url: variant.mask_image_url,
      mockup_template_url: modelData.mockup_template_url || null,
      additional_images: variant.additional_images || [],
      created_at: variant.created_at,
      description: variant.name,
    }
  } catch {
    return null
  }
}

async function ProductDetails({ id, isCustomizing }: { id: string; isCustomizing: boolean }) {
  try {
    const product = await getProduct(id)
    
    if (!product) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Product Not Found</h2>
            <p className="text-red-700">Could not load product with ID: {id}</p>
          </div>
        </div>
      )
    }
    
    if (isCustomizing) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <a href="/custom-case" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
              ← Back to device selection
            </a>
          </div>
          <CustomizationEditorWrapper
            variantId={product.id}
            caseImageUrl={toProxiedUrl(product.mockup_template_url || product.image_url)}
            maskImageUrl={product.mask_image_url ? toProxiedUrl(product.mask_image_url) : undefined}
            productName={product.name}
          />
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h2>
            {(product.description || product.product_type?.description) && (
              <p className="text-gray-600 text-sm">
                {product.description || product.product_type?.description}
              </p>
            )}
            <p className="text-2xl font-bold text-green-600 mt-3">
              ₹{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </p>
          </div>
        </div>
      )
    }

    const brandName = product.brand?.name
    const modelName = product.model?.name
    const productTypeName = product.product_type?.name
    const basePrice = product.product_type?.base_price ?? 0
    const priceModifier = product.price_modifier ?? 0
    const totalPrice = product.price ?? (basePrice + priceModifier)
    const stockQty: number = product.stock_quantity ?? 0
    const isInStock = stockQty > 0
    const description = product.description || product.product_type?.description
    const allImages = [
      product.image_url,
      ...(product.additional_images || [])
    ].filter(Boolean)
    const mrp = totalPrice * 1.25
    const discountPercent = Math.round(((mrp - totalPrice) / mrp) * 100)

    return (
      <>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap pb-1">
          <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <Link href="/predesigned" className="hover:text-orange-600 transition-colors">Cases</Link>
          {brandName && (
            <>
              <ChevronRight className="w-3 h-3 shrink-0" />
              <span className="text-gray-400">{brandName}</span>
            </>
          )}
        </nav>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Left: Images */}
          <div className="space-y-3 sm:space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100 group">
              {product.image_url ? (
                <Image
                  src={toProxiedUrl(product.image_url)}
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
                <span className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                  -{discountPercent}%
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
                    <Image
                      src={toProxiedUrl(imgUrl)}
                      alt={`${product.name} view ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-4 sm:space-y-5">
            {/* Brand + Model */}
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
                <p className="text-sm text-gray-500 mt-1">
                  Compatible with {modelName}
                </p>
              )}
            </div>

            {/* Ratings */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-green-700 text-white text-xs font-semibold px-2 py-0.5 rounded">
                <span>4.5</span>
                <Star className="w-3 h-3 fill-white" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500">
                128 Ratings & 42 Reviews
              </span>
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ₹{typeof totalPrice === 'number' ? totalPrice.toFixed(2) : totalPrice}
                </span>
                {mrp > totalPrice && (
                  <>
                    <span className="text-base sm:text-lg text-gray-400 line-through">
                      ₹{mrp.toFixed(2)}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {discountPercent}% off
                    </span>
                  </>
                )}
              </div>
              {priceModifier > 0 && (
                <p className="text-xs text-gray-500">
                  Inclusive of all taxes
                </p>
              )}
            </div>

            {/* Offers */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">Available offers</p>
              <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                <span className="text-green-600 font-bold shrink-0">•</span>
                <span><strong>Bank Offer</strong> 10% off on UPI payments</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                <span className="text-green-600 font-bold shrink-0">•</span>
                <span><strong>Free Delivery</strong> on orders above ₹499</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                <span className="text-green-600 font-bold shrink-0">•</span>
                <span><strong>Exchange Offer</strong> Get up to ₹200 off on old case return</span>
              </div>
            </div>

            {/* Stock + Color */}
            <div className="flex flex-wrap items-center gap-3">
              {isInStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />
                  In Stock
                  {stockQty <= 10 && (
                    <span className="text-green-600 font-normal">— only {stockQty} left</span>
                  )}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" />
                  Out of Stock
                </span>
              )}
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
                  `Precision fit for ${modelName}`,
                  `${productTypeName || 'Premium'} material for durability`,
                  'Shock-absorbent corners',
                  'Scratch-resistant coating',
                  'Easy access to all ports & buttons',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                    <span className="text-green-600 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Description */}
            {description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Description</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{description}</p>
              </div>
            )}

            {/* Seller Info */}
            <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-600">
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

            {/* Action Buttons */}
            <div className="pt-2">
              <ProductActions variantId={id} />
            </div>

            {/* Product Details Table */}
            <div className="border-t border-gray-200 pt-4 sm:pt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Product Details</h3>
              <dl className="space-y-2.5">
                {productTypeName && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                    <dt className="text-gray-500">Case Type</dt>
                    <dd className="font-medium text-gray-900 sm:col-span-2">{productTypeName}</dd>
                  </div>
                )}
                {modelName && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                    <dt className="text-gray-500">Compatible Model</dt>
                    <dd className="font-medium text-gray-900 sm:col-span-2">{modelName}</dd>
                  </div>
                )}
                {product.model?.screen_size && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                    <dt className="text-gray-500">Screen Size</dt>
                    <dd className="font-medium text-gray-900 sm:col-span-2">{product.model.screen_size}</dd>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                  <dt className="text-gray-500">Material</dt>
                  <dd className="font-medium text-gray-900 sm:col-span-2">{productTypeName || 'Premium'}</dd>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                  <dt className="text-gray-500">Availability</dt>
                  <dd className={`font-medium sm:col-span-2 ${isInStock ? 'text-green-700' : 'text-red-600'}`}>
                    {isInStock ? `${stockQty} in stock` : 'Out of stock'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Add to Cart */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3 lg:hidden">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div>
              <p className="text-lg font-bold text-gray-900">₹{typeof totalPrice === 'number' ? totalPrice.toFixed(2) : totalPrice}</p>
              {mrp > totalPrice && (
                <p className="text-xs text-gray-500 line-through">₹{mrp.toFixed(2)}</p>
              )}
            </div>
            <div className="flex gap-2">
              <ProductActions variantId={id} />
            </div>
          </div>
        </div>
        <div className="h-20 lg:hidden" />
      </>
    )
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Product</h2>
          <p className="text-red-700 mb-4">An error occurred while loading the product.</p>
          <div className="bg-white rounded p-4 mb-4">
            <p className="text-sm font-mono text-gray-800">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
          <div className="mt-4">
            <Link href="/predesigned" className="text-blue-600 hover:text-blue-800 underline">
              ← Back to Products
            </Link>
          </div>
        </div>
      </div>
    )
  }
}

async function RelatedProducts({ productId }: { productId: string }) {
  try {
    const supabase = await createClient()
    
    const { data: currentVariant } = await supabase
      .from('variants')
      .select('model_id, product_type_id')
      .eq('id', productId)
      .single()

    if (!currentVariant) return null

    const { data: variants, error } = await supabase
      .from('variants')
      .select(`
        id,
        color_name,
        color_hex,
        price_modifier,
        stock_quantity,
        image_url,
        model:models!inner (
          id,
          name,
          brand:brands!inner (id, name)
        ),
        product_type:product_types!inner (id, name, base_price)
      `)
      .neq('id', productId)
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .or(`model_id.eq.${currentVariant.model_id},product_type_id.eq.${currentVariant.product_type_id}`)
      .limit(4)

    if (error || !variants || variants.length === 0) return null

    const products = variants.map((variant: any) => {
      const modelRaw = Array.isArray(variant.model) ? variant.model[0] : variant.model
      const model = modelRaw as any
      const brandRaw = model && (Array.isArray(model.brand) ? model.brand[0] : model.brand)
      const brand = brandRaw as any
      const productTypeRaw = Array.isArray(variant.product_type) ? variant.product_type[0] : variant.product_type
      const productType = productTypeRaw as any
      
      return {
        id: variant.id,
        variant_id: variant.id,
        name: `${brand?.name || 'Unknown'} ${model?.name || 'Unknown'}`,
        brand: brand?.name || 'Unknown',
        model: model?.name || 'Unknown',
        product_type: productType?.name || 'Unknown',
        category: 'phone-case',
        color_name: variant.color_name,
        color_hex: variant.color_hex,
        price: (productType?.base_price || 0) + (variant.price_modifier || 0),
        in_stock: variant.stock_quantity > 0,
        image_url: variant.image_url,
      }
    })
    
    return (
      <div className="mt-12 sm:mt-16">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Related Products</h2>
          <Link href="/predesigned" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
            View All →
          </Link>
        </div>
        <ProductGrid products={products} />
      </div>
    )
  } catch {
    return null
  }
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const isCustomizing = resolvedSearchParams.customize === 'true'
  
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
    </div>
  )
}
