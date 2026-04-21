'use client'

import { memo, useCallback } from 'react'
import { ProductCard } from './ProductCard'
import { useAddToCart } from '@/src/lib/queries/cart'

interface Product {
  id: string
  name: string
  price: number
  image_url: string
  category: string
}

interface ProductGridProps {
  products: Product[]
  className?: string
  showAddToCart?: boolean
}

export const ProductGrid = memo<ProductGridProps>(({ 
  products, 
  className = '',
  showAddToCart = true 
}) => {
  const addToCartMutation = useAddToCart()
  
  const handleAddToCart = useCallback((productId: string) => {
    addToCartMutation.mutate({
      productId,
      quantity: 1,
    })
  }, [addToCartMutation])

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found.</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={showAddToCart ? handleAddToCart : undefined}
          showAddToCart={showAddToCart}
          priority={index < 4} // Prioritize first 4 images
        />
      ))}
    </div>
  )
})

ProductGrid.displayName = 'ProductGrid'