import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/src/lib/supabase/server'
import { ProductGrid } from '@/src/components/optimized/ProductGrid'
import { ProductGridSkeleton } from '@/src/components/loading/ProductSkeleton'
import { ProductActions } from '@/src/components/products/ProductActions'
import { CustomizationEditorWrapper } from '@/src/components/products/CustomizationEditorWrapper'
import { toProxiedUrl } from '@/src/utils/image-url'

export interface ProductPageProps {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    customize?: string
  }>
}

// Fetch product directly from Supabase instead of through API
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
    
    if (error || !variant) {
      console.error('Product fetch error:', error)
      return null
    }
    
    // Handle both array and object responses from Supabase
    const model = Array.isArray(variant.model) ? variant.model[0] : variant.model
    const brand = model && (Array.isArray(model.brand) ? model.brand[0] : model.brand)
    const productType = Array.isArray(variant.product_type) ? variant.product_type[0] : variant.product_type
    
    if (!model || !brand || !productType) {
      console.error('Missing required relations:', { model, brand, productType })
      return null
    }
    
    // Type assertions after null checks
    const brandData = brand as { id: any; name: any; slug: any; logo_url: any }
    const modelData = model as { id: any; name: any; slug: any; model_number: any; screen_size: any; mockup_template_url: any }
    const productTypeData = productType as { id: any; name: any; slug: any; base_price: any; description: any; material_properties: any }
    
    return {
      id: variant.id,
      variant_id: variant.id,
      name: `${brandData.name} ${modelData.name}`,
      brand: brandData,
      model: modelData,
      product_type: productTypeData,
      color_name: variant.color_name,
      color_hex: variant.color_hex,
      price: parseFloat(String(productTypeData.base_price)) + parseFloat(String(variant.price_modifier)),
      base_price: parseFloat(String(productTypeData.base_price)),
      price_modifier: parseFloat(String(variant.price_modifier)),
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
  } catch (error) {
    console.error('Failed to fetch product:', error)
    return null
  }
}

async function ProductDetails({ id, isCustomizing }: { id: string; isCustomizing: boolean }) {
  try {
    const product = await getProduct(id)
    
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
            caseImageUrl={toProxiedUrl(product.mockup_template_url || product.image_url)}
            maskImageUrl={product.mask_image_url ? toProxiedUrl(product.mask_image_url) : undefined}
            productName={product.name}
          />

          {/* Product info below editor */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h2>
            {(product.description || product.product_type?.description) && (
              <p className="text-gray-600 text-sm">
                {product.description || product.product_type?.description}
              </p>
            )}
            <p className="text-2xl font-bold text-green-600 mt-3">
              ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </p>
          </div>
        </div>
      )
    }

    // Resolve display values
    const brandName = product.brand?.name
    const modelName = product.model?.name
    const productTypeName = product.product_type?.name
    const material = product.product_type?.material_properties || product.product_type?.name
    const basePrice = product.product_type?.base_price ?? 0
    const priceModifier = product.price_modifier ?? 0
    const totalPrice = product.price ?? (basePrice + priceModifier)
    const stockQty: number = product.stock_quantity ?? 0
    const isInStock = stockQty > 0
    const description = product.description || product.product_type?.description

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
            {product.image_url ? (
              <Image
                src={toProxiedUrl(product.image_url)}
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
                    src={toProxiedUrl(imgUrl)}
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
            {brandName && modelName && (
              <p className="text-sm text-gray-500 mb-1">
                {brandName} · {modelName}
              </p>
            )}
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl font-bold text-green-600">
                ${typeof totalPrice === 'number' ? totalPrice.toFixed(2) : totalPrice}
              </span>
              {priceModifier > 0 && (
                <span className="text-sm text-gray-400">
                  Base ${basePrice.toFixed(2)} + ${priceModifier.toFixed(2)} modifier
                </span>
              )}
            </div>
          </div>

          {/* Stock badge */}
          <div>
            {isInStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                In Stock
                {stockQty <= 10 && (
                  <span className="text-green-600 font-normal">— only {stockQty} left</span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Out of Stock
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
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

          {/* Add to cart / customize */}
          <ProductActions variantId={id} />

          {/* Product details table */}
          <div className="border-t pt-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Product Details</h3>
            <dl className="space-y-3">
              {productTypeName && (
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Type</dt>
                  <dd className="font-medium text-gray-900">{productTypeName}</dd>
                </div>
              )}
              {material && material !== productTypeName && (
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Material</dt>
                  <dd className="font-medium text-gray-900">{material}</dd>
                </div>
              )}
              {brandName && (
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Brand</dt>
                  <dd className="font-medium text-gray-900">{brandName}</dd>
                </div>
              )}
              {modelName && (
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Compatible With</dt>
                  <dd className="font-medium text-gray-900">{modelName}</dd>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Availability</dt>
                <dd className={`font-medium ${isInStock ? 'text-green-700' : 'text-red-600'}`}>
                  {isInStock ? `${stockQty} in stock` : 'Out of stock'}
                </dd>
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
    const supabase = await createClient()
    
    // Get the current variant details
    const { data: currentVariant } = await supabase
      .from('variants')
      .select('model_id, product_type_id')
      .eq('id', productId)
      .single()

    if (!currentVariant) {
      return null
    }

    // Find related products (same model or product type)
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
          brand:brands!inner (
            id,
            name
          )
        ),
        product_type:product_types!inner (
          id,
          name,
          base_price
        )
      `)
      .neq('id', productId)
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .or(`model_id.eq.${currentVariant.model_id},product_type_id.eq.${currentVariant.product_type_id}`)
      .limit(4)

    if (error || !variants || variants.length === 0) {
      return null
    }

    // Format products
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
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
        <ProductGrid products={products} />
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
  )
}
