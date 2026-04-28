import { revalidateTag, revalidatePath } from 'next/cache'
import { globalCache, productCache, userCache, searchCache } from './memory-cache'

// Cache invalidation strategies
export class CacheInvalidator {
  // Product-related invalidation
  static async invalidateProduct(productId: string) {
    // Invalidate Next.js cache
    revalidateTag('product-detail')
    revalidateTag('products')
    revalidatePath(`/products/${productId}`)
    
    // Invalidate memory cache
    productCache.delete(`product:${productId}`)
    productCache.delete(`products:related:${productId}`)
    
    // Clear related product lists that might include this product
    const productKeys = productCache.keys().filter(key => 
      key.startsWith('products:') && !key.includes(':related:')
    )
    productKeys.forEach(key => productCache.delete(key))
  }
  
  static async invalidateProducts(category?: string) {
    // Invalidate Next.js cache
    revalidateTag('products')
    revalidatePath('/products')
    
    if (category) {
      revalidatePath(`/products?category=${category}`)
    }
    
    // Invalidate memory cache
    if (category) {
      productCache.delete(`products:${category}:unlimited`)
      productCache.delete(`products:${category}:20`)
      productCache.delete(`products:${category}:40`)
    } else {
      // Clear all product lists
      const productListKeys = productCache.keys().filter(key => 
        key.startsWith('products:') && !key.includes(':related:')
      )
      productListKeys.forEach(key => productCache.delete(key))
    }
  }
  
  static async invalidateFeaturedProducts() {
    revalidateTag('products')
    productCache.delete('products:featured')
  }
  
  // Category-related invalidation
  static async invalidateCategories() {
    revalidateTag('categories')
    productCache.delete('categories:all')
    
    // Also invalidate product pages since they show categories
    revalidatePath('/products')
  }
  
  // User-related invalidation
  static async invalidateUser(userId: string) {
    revalidateTag('users')
    userCache.delete(`user:profile:${userId}`)
    
    // Clear user-specific data
    globalCache.delete(`cart:${userId}`)
    globalCache.delete(`orders:${userId}`)
  }
  
  // Cart-related invalidation
  static async invalidateCart(userId: string) {
    globalCache.delete(`cart:${userId}`)
    
    // If using server-side cart rendering, invalidate those paths too
    revalidatePath('/cart')
  }
  
  // Search-related invalidation
  static async invalidateSearch(query?: string) {
    if (query) {
      searchCache.delete(`search:${query}`)
    } else {
      searchCache.clear()
    }
  }
  
  // Order-related invalidation
  static async invalidateOrders(userId: string) {
    globalCache.delete(`orders:${userId}`)
    revalidatePath('/orders')
  }
  
  // Global invalidation (use sparingly)
  static async invalidateAll() {
    // Clear all memory caches
    globalCache.clear()
    productCache.clear()
    userCache.clear()
    searchCache.clear()
    
    // Invalidate all Next.js cache tags
    revalidateTag('products')
    revalidateTag('product-detail')
    revalidateTag('categories')
    revalidateTag('users')
    revalidateTag('orders')
    revalidateTag('cart')
    
    // Revalidate key paths
    revalidatePath('/')
    revalidatePath('/products')
    revalidatePath('/cart')
    revalidatePath('/orders')
  }
}

// Webhook handlers for external invalidation
export async function handleProductWebhook(
  action: 'created' | 'updated' | 'deleted',
  productId: string,
  category?: string
) {
  switch (action) {
    case 'created':
      await CacheInvalidator.invalidateProducts(category)
      break
    case 'updated':
      await CacheInvalidator.invalidateProduct(productId)
      break
    case 'deleted':
      await CacheInvalidator.invalidateProduct(productId)
      await CacheInvalidator.invalidateProducts(category)
      break
  }
}

export async function handleCategoryWebhook(
  action: 'created' | 'updated' | 'deleted'
) {
  await CacheInvalidator.invalidateCategories()
  
  // If categories changed, product pages might need updates too
  await CacheInvalidator.invalidateProducts()
}

export async function handleUserWebhook(
  action: 'created' | 'updated' | 'deleted',
  userId: string
) {
  switch (action) {
    case 'updated':
    case 'deleted':
      await CacheInvalidator.invalidateUser(userId)
      break
  }
}

// Scheduled cache cleanup
export function scheduleCleanup() {
  // Clean up expired items every 5 minutes
  setInterval(() => {
    const globalRemoved = globalCache.cleanup()
    const productRemoved = productCache.cleanup()
    const userRemoved = userCache.cleanup()
    const searchRemoved = searchCache.cleanup()
    
    const totalRemoved = globalRemoved + productRemoved + userRemoved + searchRemoved
    
    if (totalRemoved > 0) {
      console.log(`Cache cleanup: removed ${totalRemoved} expired items`)
    }
  }, 5 * 60 * 1000) // 5 minutes
}

// Cache warming after invalidation
export async function warmCacheAfterInvalidation(type: 'products' | 'categories' | 'featured') {
  try {
    switch (type) {
      case 'products':
        // Warm popular product categories
        const popularCategories = ['iphone', 'samsung', 'google-pixel']
        for (const category of popularCategories) {
          // This would trigger cache population
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?category=${category}`)
        }
        break
        
      case 'categories':
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`)
        break
        
      case 'featured':
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/featured`)
        break
    }
  } catch (error) {
    console.error(`Failed to warm cache for ${type}:`, error)
  }
}

// Cache statistics and monitoring
export function getCacheStats() {
  return {
    global: globalCache.getStats(),
    products: productCache.getStats(),
    users: userCache.getStats(),
    search: searchCache.getStats(),
    hitRates: {
      global: globalCache.getHitRate(),
      products: productCache.getHitRate(),
      users: userCache.getHitRate(),
      search: searchCache.getHitRate(),
    }
  }
}

// Cache health check
export function checkCacheHealth() {
  const stats = getCacheStats()
  const issues = []
  
  // Check hit rates
  Object.entries(stats.hitRates).forEach(([cache, hitRate]) => {
    if (hitRate < 0.5) { // Less than 50% hit rate
      issues.push(`Low hit rate for ${cache} cache: ${(hitRate * 100).toFixed(1)}%`)
    }
  })
  
  // Check cache sizes
  Object.entries(stats).forEach(([cache, stat]) => {
    if (typeof stat === 'object' && 'size' in stat && 'maxSize' in stat) {
      const utilization = stat.size / stat.maxSize
      if (utilization > 0.9) { // More than 90% full
        issues.push(`High utilization for ${cache} cache: ${(utilization * 100).toFixed(1)}%`)
      }
    }
  })
  
  return {
    healthy: issues.length === 0,
    issues,
    stats
  }
}