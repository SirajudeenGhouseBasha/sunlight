'use client'

import { memo } from 'react'
import type { PLPProduct } from '@/src/types/plp'
import { PLPProductCard } from './PLPProductCard'
import { ProductCardSkeleton } from './ProductGridSkeleton'

interface PLPProductGridProps {
  products: PLPProduct[]
  isLoading: boolean
  isFetchingNextPage: boolean
  loadMoreRef: React.RefObject<HTMLDivElement | null>
}

export const PLPProductGrid = memo(function PLPProductGrid({
  products,
  isLoading,
  isFetchingNextPage,
  loadMoreRef,
}: PLPProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {Array.from({ length: 8 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-2 gap-3">
        {products.map((product, index) => (
          <PLPProductCard
            key={product.id}
            product={product}
            priority={index < 4}
          />
        ))}
      </div>

      <div ref={loadMoreRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {Array.from({ length: 4 }, (_, i) => (
            <ProductCardSkeleton key={`next-${i}`} />
          ))}
        </div>
      )}
    </div>
  )
})
