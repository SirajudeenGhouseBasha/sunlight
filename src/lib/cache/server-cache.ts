import { unstable_cache } from 'next/cache'
import { productCache } from './memory-cache'
import { headers } from 'next/headers'

// Cache configuration constants
export const CACHE_TAGS = {
  PRODUCTS: 'products',
  PRODUCT_DETAIL: 'product-detail',
  CATEGORIES: 'categories',
  USERS: 'users',
  ORDERS: 'orders',
  CART: 'cart',
} as const

export const CACHE_REVALIDATE = {
  STATIC: 60 * 60, // 1 hour for static data
  PRODUCTS: 5 * 60, // 5 minutes for product data
  USER_DATA: 2 * 60, // 2 minutes for user data
  DYNAMIC: 60, // 1 minute for dynamic data
} as const

async function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  try {
    const requestHeaders = await headers()
    const host = requestHeaders.get('host')
    if (host) {
      const protocol = host.includes('localhost') ? 'http' : 'https'
      return `${protocol}://${host}`
    }
  } catch {
    // no request context (e.g. background cache warmers)
  }

  return 'http://localhost:3003'
}

// Generic cached function wrapper
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  revalidate: number,
  tags: string[]
) {
  return unstable_cache(
    fn,
    [keyPrefix],
    {
      revalidate,
      tags,
    }
  )
}

// Product-related cached functions
export const getCachedProducts = unstable_cache(
  async (category?: string, limit?: number) => {
    // This would normally call your database/API
    const cacheKey = `products:${category || 'all'}:${limit || 'unlimited'}`
    
    return productCache.getOrSet(cacheKey, async () => {
      const apiBaseUrl = await getApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/api/products?${new URLSearchParams({
        ...(category && { category }),
        ...(limit && { limit: limit.toString() }),
      })}`, { cache: 'no-store' })
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const result = await response.json()
      return result.products || result.data || result
    })
  },
  ['products'],
  {
    revalidate: CACHE_REVALIDATE.PRODUCTS,
    tags: [CACHE_TAGS.PRODUCTS],
  }
)

export const getCachedProduct = unstable_cache(
  async (id: string) => {
    const cacheKey = `product:${id}`
    
    return productCache.getOrSet(cacheKey, async () => {
      const apiBaseUrl = await getApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/api/products/${id}`, { cache: 'no-store' })
      
      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }
      
      return response.json()
    })
  },
  ['product-detail'],
  {
    revalidate: CACHE_REVALIDATE.PRODUCTS,
    tags: [CACHE_TAGS.PRODUCT_DETAIL],
  }
)

export const getCachedFeaturedProducts = unstable_cache(
  async () => {
    const cacheKey = 'products:featured'
    
    return productCache.getOrSet(cacheKey, async () => {
      const apiBaseUrl = await getApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/api/products/featured`, { cache: 'no-store' })
      
      if (!response.ok) {
        throw new Error('Failed to fetch featured products')
      }
      
      return response.json()
    })
  },
  ['featured-products'],
  {
    revalidate: CACHE_REVALIDATE.PRODUCTS,
    tags: [CACHE_TAGS.PRODUCTS],
  }
)

export const getCachedRelatedProducts = unstable_cache(
  async (productId: string) => {
    const cacheKey = `products:related:${productId}`
    
    return productCache.getOrSet(cacheKey, async () => {
      const apiBaseUrl = await getApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/api/products/${productId}/related`, { cache: 'no-store' })
      
      if (!response.ok) {
        throw new Error('Failed to fetch related products')
      }
      
      return response.json()
    })
  },
  ['related-products'],
  {
    revalidate: CACHE_REVALIDATE.PRODUCTS,
    tags: [CACHE_TAGS.PRODUCTS],
  }
)

// Category-related cached functions
export const getCachedCategories = unstable_cache(
  async () => {
    const cacheKey = 'categories:all'
    
    return productCache.getOrSet(cacheKey, async () => {
      const apiBaseUrl = await getApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/api/product-types`, { cache: 'no-store' })
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      
      const result = await response.json()
      return result.product_types || result.data || result
    })
  },
  ['categories'],
  {
    revalidate: CACHE_REVALIDATE.STATIC,
    tags: [CACHE_TAGS.CATEGORIES],
  }
)

// User-related cached functions (be careful with user data caching)
export const getCachedUserProfile = unstable_cache(
  async (userId: string) => {
    // Note: Be very careful caching user data - ensure proper access control
    const cacheKey = `user:profile:${userId}`
    
    return productCache.getOrSet(cacheKey, async () => {
      const apiBaseUrl = await getApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/api/users/${userId}`, { cache: 'no-store' })
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }
      
      return response.json()
    }, CACHE_REVALIDATE.USER_DATA * 1000) // Convert to milliseconds for memory cache
  },
  ['user-profile'],
  {
    revalidate: CACHE_REVALIDATE.USER_DATA,
    tags: [CACHE_TAGS.USERS],
  }
)

// Cache invalidation helpers
export async function invalidateProductCache() {
  const { revalidateTag } = await import('next/cache')
  revalidateTag(CACHE_TAGS.PRODUCTS)
  revalidateTag(CACHE_TAGS.PRODUCT_DETAIL)
}

export async function invalidateUserCache(userId?: string) {
  const { revalidateTag } = await import('next/cache')
  revalidateTag(CACHE_TAGS.USERS)
  
  // Also clear from memory cache
  if (userId) {
    productCache.delete(`user:profile:${userId}`)
  }
}

export async function invalidateAllCache() {
  const { revalidateTag } = await import('next/cache')
  Object.values(CACHE_TAGS).forEach(tag => {
    revalidateTag(tag)
  })
  
  // Clear memory caches
  productCache.clear()
}

// Cache warming functions (call these during build or on server start)
export async function warmProductCache() {
  try {
    await getCachedProducts() // Warm general products
    await getCachedFeaturedProducts() // Warm featured products
    await getCachedCategories() // Warm categories
    console.log('Product cache warmed successfully')
  } catch (error) {
    console.error('Failed to warm product cache:', error)
  }
}