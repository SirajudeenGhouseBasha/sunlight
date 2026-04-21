'use client'

import { memo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'

interface Product {
  id: string
  name: string
  price: number
  image_url: string
  category: string
}

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string) => void
  showAddToCart?: boolean
  priority?: boolean
}

export const ProductCard = memo<ProductCardProps>(({ 
  product, 
  onAddToCart, 
  showAddToCart = true,
  priority = false 
}) => {
  const handleAddToCart = useCallback(() => {
    onAddToCart?.(product.id)
  }, [product.id, onAddToCart])

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden">
        <Link href={`/products/${product.id}`}>
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            priority={priority}
          />
        </Link>
      </div>
      
      <CardContent className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-green-600">
            ${product.price.toFixed(2)}
          </span>
          
          {showAddToCart && onAddToCart && (
            <Button 
              size="sm" 
              onClick={handleAddToCart}
              className="text-xs"
            >
              Add to Cart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

ProductCard.displayName = 'ProductCard'