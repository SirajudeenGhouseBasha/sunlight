'use client'

import { memo, useCallback } from 'react'
import { ProductCard } from './ProductCard'
import { useCart } from '@/src/context/CartContext'

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
  const { addToCart } = useCart()
  
  const handleAddToCart = useCallback(async (productId: string) => {
    try {
      await addToCart(productId)
    } catch {
      // Surface errors via the cart context
    }
  }, [addToCart])

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