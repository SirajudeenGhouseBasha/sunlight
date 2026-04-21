'use client'

import { useProducts, usePrefetchProduct } from '@/src/lib/queries/products'
import { useAddToCart } from '@/src/lib/queries/cart'
import { useState } from 'react'
import Image from 'next/image'

/**
 * Example component demonstrating TanStack Query usage
 * Shows how to fetch products with caching and optimistic updates
 */
export function ProductListExample() {
  const [selectedCategory, setSelectedCategory] = useState<string>()
  
  // Fetch products with automatic caching
  const { 
    data: productsResponse, 
    isLoading, 
    isError, 
    error 
  } = useProducts({ category: selectedCategory })
  
  // Prefetch utility for performance
  const prefetchProduct = usePrefetchProduct()
  
  // Cart mutation with optimistic updates
  const addToCartMutation = useAddToCart()
  
  const handleAddToCart = (productId: string) => {
    addToCartMutation.mutate(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          console.log('Added to cart successfully')
        },
        onError: (error) => {
          console.error('Failed to add to cart:', error)
        },
      }
    )
  }
  
  const handleProductHover = (productId: string) => {
    // Prefetch product details on hover for instant navigation
    prefetchProduct(productId)
  }
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
            <div className="bg-gray-200 h-4 rounded mb-1"></div>
            <div className="bg-gray-200 h-4 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }
  
  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">
          Failed to load products: {error?.message}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }
  
  const products = productsResponse || []
  
  return (
    <div>
      {/* Category Filter */}
      <div className="mb-6">
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || undefined)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Categories</option>
          <option value="cases">Cases</option>
          <option value="accessories">Accessories</option>
          <option value="screen-protectors">Screen Protectors</option>
        </select>
      </div>
      
      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div 
            key={product.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            onMouseEnter={() => handleProductHover(product.id)}
          >
            <Image
              src={product.image_url}
              alt={product.name}
              width={200}
              height={200}
              className="w-full aspect-square object-cover rounded-md mb-2"
            />
            <h3 className="font-medium text-sm mb-1 line-clamp-2">
              {product.name}
            </h3>
            <p className="text-lg font-bold text-gray-900 mb-2">
              ${product.price}
            </p>
            <button
              onClick={() => handleAddToCart(product.id)}
              disabled={addToCartMutation.isPending}
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        ))}
      </div>
      
      {/* Loading state for add to cart */}
      {addToCartMutation.isPending && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg">
          Adding to cart...
        </div>
      )}
    </div>
  )
}