'use client'

import { memo } from 'react'

export const ProductCardSkeleton = memo(function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square bg-neutral-100 rounded-xl" />
      <div className="mt-2.5 space-y-2 px-0.5">
        <div className="h-2.5 bg-neutral-100 rounded w-1/3" />
        <div className="h-3.5 bg-neutral-100 rounded w-3/4" />
        <div className="h-4 bg-neutral-100 rounded w-1/2" />
      </div>
    </div>
  )
})

interface ProductGridSkeletonProps {
  count?: number
}

export const ProductGridSkeleton = memo(function ProductGridSkeleton({
  count = 8,
}: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
})
