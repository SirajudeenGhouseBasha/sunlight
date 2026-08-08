'use client'

import { memo, useCallback, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { PLPProduct } from '@/src/types/plp'
import { useCart } from '@/src/context/CartContext'

interface PLPProductCardProps {
  product: PLPProduct
  priority?: boolean
}

export const PLPProductCard = memo(function PLPProductCard({
  product,
  priority = false,
}: PLPProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { addToCart } = useCart()

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted((prev) => !prev)
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }, [isWishlisted])

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isAddingToCart) return
    setIsAddingToCart(true)
    try {
      await addToCart(product.variant_id)
      toast.success('Added to cart')
    } catch {
      toast.error('Failed to add to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }, [product.variant_id, addToCart, isAddingToCart])

  const formattedPrice = `₹${product.price.toFixed(2)}`
  const formattedOriginalPrice = product.discount_percent
    ? `₹${product.base_price.toFixed(2)}`
    : null

  const isLowStock = product.in_stock && product.stock_quantity <= 5

  return (
    <div className="group relative">
      <Link href={`/products/${product.variant_id}`} className="block">
        <div className="relative aspect-square bg-neutral-50 rounded-xl overflow-hidden mb-2.5">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
              <span className="text-neutral-300 text-xs">No image</span>
            </div>
          )}

          {product.discount_percent && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none">
              -{product.discount_percent}%
            </span>
          )}

          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isWishlisted
                  ? 'fill-red-500 text-red-500'
                  : 'text-neutral-600'
              }`}
            />
          </button>
        </div>

        <div className="space-y-1 px-0.5">
          <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            {product.brand_name}
          </p>

          <h3 className="text-sm font-medium text-neutral-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.model_name} {product.product_type_name}
          </h3>

          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold text-neutral-900">
              {formattedPrice}
            </span>
            {formattedOriginalPrice && (
              <span className="text-xs text-neutral-400 line-through">
                {formattedOriginalPrice}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-2.5 px-0.5 flex items-center gap-2">
        <button
          onClick={handleAddToCart}
          disabled={!product.in_stock || isAddingToCart}
          className="flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed transition-colors duration-150 active:scale-[0.97]"
        >
          {isAddingToCart ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{product.in_stock ? 'Add' : 'Out of Stock'}</span>
            </>
          )}
        </button>

        {isLowStock && (
          <div className="flex items-center gap-1 text-amber-600 shrink-0">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-medium">Low</span>
          </div>
        )}
      </div>
    </div>
  )
})
