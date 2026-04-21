interface CacheItem<T> {
  data: T
  expires: number
  lastAccessed: number
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  maxSize: number
}

export class MemoryCache<T = any> {
  private cache = new Map<string, CacheItem<T>>()
  private maxSize: number
  private defaultTTL: number
  private stats: CacheStats

  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize,
    }
  }

  set(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL
    const expires = Date.now() + ttl
    const lastAccessed = Date.now()

    // If cache is at max size, remove least recently used item
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, { data, expires, lastAccessed })
    this.stats.size = this.cache.size
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      this.stats.misses++
      return null
    }

    // Check if item has expired
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.size = this.cache.size
      return null
    }

    // Update last accessed time for LRU
    item.lastAccessed = Date.now()
    this.cache.set(key, item) // Move to end of insertion order
    
    this.stats.hits++
    return item.data
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      this.stats.size = this.cache.size
      return false
    }
    
    return true
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.size = this.cache.size
    }
    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.stats.size = 0
    this.stats.hits = 0
    this.stats.misses = 0
  }

  // Get or set pattern
  async getOrSet<U extends T>(
    key: string, 
    factory: () => Promise<U> | U, 
    ttlMs?: number
  ): Promise<U> {
    const cached = this.get(key)
    if (cached !== null) {
      return cached as U
    }

    const data = await factory()
    this.set(key, data, ttlMs)
    return data
  }

  // Evict least recently used item
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  // Clean up expired items
  cleanup(): number {
    const now = Date.now()
    let removedCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
        removedCount++
      }
    }

    this.stats.size = this.cache.size
    return removedCount
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // Get cache hit rate
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses
    return total === 0 ? 0 : this.stats.hits / total
  }

  // Get all keys (for debugging)
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Get cache size
  size(): number {
    return this.cache.size
  }
}

// Global cache instances
export const globalCache = new MemoryCache(1000, 5 * 60 * 1000) // 5 minutes
export const productCache = new MemoryCache(500, 10 * 60 * 1000) // 10 minutes for products
export const userCache = new MemoryCache(200, 2 * 60 * 1000) // 2 minutes for user data
export const searchCache = new MemoryCache(100, 1 * 60 * 1000) // 1 minute for search results

// Cleanup interval to remove expired items
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    globalCache.cleanup()
    productCache.cleanup()
    userCache.cleanup()
    searchCache.cleanup()
  }, 60 * 1000) // Cleanup every minute
}