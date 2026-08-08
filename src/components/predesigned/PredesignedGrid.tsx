'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react'
import { useCart } from '@/src/context/CartContext'
import { toast } from 'react-hot-toast'

interface PredesignedProduct {
  id: string
  name: string
  description?: string
  price: number
  image_url: string
  brand: string
  model: string
  color: string
  color_hex?: string
  category: string
  tags: string[]
  is_featured: boolean
  stock_quantity: number
  in_stock: boolean
}

interface PredesignedGridProps {
  products: PredesignedProduct[]
}

function PredesignedCard({ product, index }: { product: PredesignedProduct; index: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [adding, setAdding] = useState(false)
  const { addToCart } = useCart()
  const router = useRouter()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!product.in_stock) {
      toast.error('This item is out of stock')
      return
    }

    setAdding(true)
    try {
      await addToCart('', undefined, 1, undefined, product.id)
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span className="text-lg">🛒</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">Added to cart!</p>
              <p className="text-xs text-gray-500 truncate">{product.name}</p>
            </div>
            <button
              onClick={() => {
                toast.dismiss(t.id)
                router.push('/cart')
              }}
              className="shrink-0 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              View Cart
            </button>
          </div>
        ),
        {
          duration: 4000,
          style: {
            background: '#fff',
            color: '#111',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '12px 14px',
            maxWidth: '360px',
          },
        }
      )
    } catch {
      toast.error('Failed to add to cart')
    } finally {
      setAdding(false)
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLiked(!isLiked)
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites', {
      icon: isLiked ? '💔' : '❤️',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/predesigned/${product.id}`}>
        <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gray-50">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.is_featured && (
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Star size={10} fill="currentColor" />
                  Featured
                </span>
              )}
              {!product.in_stock && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            } md:opacity-0 md:group-hover:opacity-100`}>
              <button
                onClick={handleLike}
                className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                  isLiked 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              <Link 
                href={`/predesigned/${product.id}`}
                className="p-2 rounded-full bg-white/80 text-gray-700 hover:bg-white backdrop-blur-sm transition-colors"
              >
                <Eye size={16} />
              </Link>
            </div>

            {/* Quick Add Button */}
            <div className={`absolute bottom-3 left-3 right-3 transition-all duration-200 ${
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            } md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0`}>
              <button
                onClick={handleAddToCart}
                disabled={!product.in_stock || adding}
                className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                  product.in_stock
                    ? 'bg-black text-white hover:bg-gray-800 disabled:opacity-70'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={16} className="inline mr-2" />
                {adding ? 'Adding…' : product.in_stock ? 'Quick Add' : 'Out of Stock'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="mb-2">
              <h3 className="font-semibold text-gray-900 text-sm mb-1 overflow-hidden" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {product.name}
              </h3>
              <p className="text-xs text-gray-500">
                {product.brand} {product.model}
              </p>
            </div>

            {/* Color and Category */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
              {product.color_hex && (
                <div 
                  className="w-4 h-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: product.color_hex }}
                />
              )}
              <span className="text-xs text-gray-600">{product.color}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-600 capitalize">{product.category}</span>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {product.tags.slice(0, 2).map((tag, tagIndex) => (
                  <span 
                    key={tagIndex}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {product.tags.length > 2 && (
                  <span className="text-xs text-gray-400">
                    +{product.tags.length - 2} more
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-lg font-bold text-gray-900">
                ₹{product.price.toFixed(2)}
              </span>
              <span className="text-xs text-gray-500 hidden sm:inline">
                Stock: {product.stock_quantity}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function PredesignedGrid({ products }: PredesignedGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No designs found
          </h3>
          <p className="text-gray-600 mb-6">
            We couldn't find any predesigned cases matching your criteria. Try adjusting your filters or check back later for new designs.
          </p>
          <Link 
            href="/custom-case"
            className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            Create Custom Design
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Results Count */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          Showing {products.length} design{products.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {products.map((product, index) => (
          <PredesignedCard 
            key={product.id} 
            product={product} 
            index={index}
          />
        ))}
      </div>

      {/* Load More (if needed) */}
      {products.length >= 24 && (
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
            Load More Designs
          </button>
        </div>
      )}
    </div>
  )
}