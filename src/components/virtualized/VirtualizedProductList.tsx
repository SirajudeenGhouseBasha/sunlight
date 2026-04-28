'use client'

import { useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import { useInfiniteProducts } from '@/src/lib/queries/products'
import { ProductCard } from '@/src/components/optimized/ProductCard'
import { useOptimizedCart } from '@/src/hooks/useOptimizedCart'

interface VirtualizedProductListProps {
  category?: string
  height?: number
  itemHeight?: number
  className?: string
}

const ITEM_HEIGHT = 320 // Height of each product card
const CONTAINER_HEIGHT = 600 // Height of the virtualized container

export function VirtualizedProductList({
  category,
  height = CONTAINER_HEIGHT,
  itemHeight = ITEM_HEIGHT,
  className = '',
}: VirtualizedProductListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteProducts({ category })

  const { addToCart } = useOptimizedCart()

  // Flatten all pages into a single array
  const items = useMemo(() => {
    return data?.pages.flatMap(page => page.data || page) || []
  }, [data])

  // Handle add to cart
  const handleAddToCart = useCallback((productId: string) => {
    addToCart(productId)
  }, [addToCart])

  // Row renderer for react-window
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const product = items[index]
    
    // Load more when approaching the end
    if (index === items.length - 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }

    if (!product) {
      return (
        <div style={style} className="p-2">
          <div className="bg-gray-200 rounded-lg animate-pulse h-72" />
        </div>
      )
    }

    return (
      <div style={style} className="p-2">
        <ProductCard
          product={product}
          onAddToCart={handleAddToCart}
          priority={index < 4} // Prioritize first 4 items
        />
      </div>
    )
  }, [items, hasNextPage, isFetchingNextPage, fetchNextPage, handleAddToCart])

  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg animate-pulse h-72" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load products</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={items.length + (hasNextPage ? 1 : 0)} // +1 for loading indicator
        itemSize={itemHeight}
        width="100%"
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {Row}
      </List>
      
      {isFetchingNextPage && (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
            Loading more products...
          </div>
        </div>
      )}
    </div>
  )
}