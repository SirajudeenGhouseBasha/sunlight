'use client'

import { memo, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/src/components/ui/button'
import { Minus, Plus, Trash2 } from 'lucide-react'

interface CartItemData {
  id: string
  product_id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    image_url: string
  }
  variant?: {
    id: string
    color: string
    material: string
  }
}

interface CartItemProps {
  item: CartItemData
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  isUpdating?: boolean
}

export const CartItem = memo<CartItemProps>(({ 
  item, 
  onUpdateQuantity, 
  onRemove,
  isUpdating = false 
}) => {
  const handleIncrement = useCallback(() => {
    onUpdateQuantity(item.id, item.quantity + 1)
  }, [item.id, item.quantity, onUpdateQuantity])

  const handleDecrement = useCallback(() => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1)
    }
  }, [item.id, item.quantity, onUpdateQuantity])

  const handleRemove = useCallback(() => {
    onRemove(item.id)
  }, [item.id, onRemove])

  return (
    <div className="flex items-center gap-4 p-4 border-b">
      <div className="relative w-16 h-16 flex-shrink-0">
        <Image
          src={item.product.image_url}
          alt={item.product.name}
          fill
          className="object-cover rounded"
          sizes="64px"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">
          {item.product.name}
        </h4>
        {item.variant && (
          <p className="text-xs text-gray-500">
            {item.variant.color} • {item.variant.material}
          </p>
        )}
        <p className="text-sm font-semibold text-green-600">
          ${item.price.toFixed(2)}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDecrement}
          disabled={item.quantity <= 1 || isUpdating}
          className="w-8 h-8 p-0"
        >
          <Minus className="w-3 h-3" />
        </Button>
        
        <span className="w-8 text-center text-sm font-medium">
          {item.quantity}
        </span>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleIncrement}
          disabled={isUpdating}
          className="w-8 h-8 p-0"
        >
          <Plus className="w-3 h-3" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRemove}
          disabled={isUpdating}
          className="w-8 h-8 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
})

CartItem.displayName = 'CartItem'