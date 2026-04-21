import { NextResponse } from 'next/server'

// Cache control configurations for different types of data
export const CACHE_CONTROL = {
  // Static assets - cache for 1 year
  STATIC_ASSETS: 'public, max-age=31536000, immutable',
  
  // Product data - cache for 5 minutes, stale-while-revalidate for 1 hour
  PRODUCTS: 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
  
  // User-specific data - private cache for 2 minutes
  USER_DATA: 'private, max-age=120, must-revalidate',
  
  // Search results - cache for 1 minute
  SEARCH: 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
  
  // Dynamic content - cache for 30 seconds
  DYNAMIC: 'public, max-age=30, s-maxage=30, stale-while-revalidate=60',
  
  // No cache for sensitive operations
  NO_CACHE: 'no-cache, no-store, must-revalidate, max-age=0',
  
  // Short cache for frequently changing data
  SHORT: 'public, max-age=60, s-maxage=60',
  
  // Medium cache for semi-static data
  MEDIUM: 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
  
  // Long cache for static data
  LONG: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200',
} as const

// ETag generation helper
export function generateETag(data: any): string {
  const hash = require('crypto')
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex')
  return `"${hash}"`
}

// Cache headers helper
export interface CacheOptions {
  cacheControl?: string
  etag?: boolean
  lastModified?: Date
  vary?: string[]
}

export function createCachedResponse(
  data: any,
  options: CacheOptions = {}
): NextResponse {
  const response = NextResponse.json(data)
  
  // Set cache control
  if (options.cacheControl) {
    response.headers.set('Cache-Control', options.cacheControl)
  }
  
  // Set ETag if requested
  if (options.etag) {
    const etag = generateETag(data)
    response.headers.set('ETag', etag)
  }
  
  // Set Last-Modified if provided
  if (options.lastModified) {
    response.headers.set('Last-Modified', options.lastModified.toUTCString())
  }
  
  // Set Vary headers
  if (options.vary && options.vary.length > 0) {
    response.headers.set('Vary', options.vary.join(', '))
  }
  
  return response
}

// Conditional request helpers
export function checkIfModifiedSince(
  request: Request,
  lastModified: Date
): boolean {
  const ifModifiedSince = request.headers.get('If-Modified-Since')
  if (!ifModifiedSince) return true
  
  const ifModifiedSinceDate = new Date(ifModifiedSince)
  return lastModified > ifModifiedSinceDate
}

export function checkIfNoneMatch(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get('If-None-Match')
  if (!ifNoneMatch) return true
  
  return ifNoneMatch !== etag
}

// Response helpers for different cache scenarios
export function createProductResponse(data: any, lastModified?: Date) {
  return createCachedResponse(data, {
    cacheControl: CACHE_CONTROL.PRODUCTS,
    etag: true,
    lastModified,
    vary: ['Accept-Encoding'],
  })
}

export function createSearchResponse(data: any) {
  return createCachedResponse(data, {
    cacheControl: CACHE_CONTROL.SEARCH,
    etag: true,
    vary: ['Accept-Encoding'],
  })
}

export function createUserDataResponse(data: any) {
  return createCachedResponse(data, {
    cacheControl: CACHE_CONTROL.USER_DATA,
    etag: true,
    vary: ['Authorization', 'Accept-Encoding'],
  })
}

export function createStaticResponse(data: any) {
  return createCachedResponse(data, {
    cacheControl: CACHE_CONTROL.STATIC_ASSETS,
    etag: true,
    vary: ['Accept-Encoding'],
  })
}

export function createNotModifiedResponse(): NextResponse {
  const response = new NextResponse(null, { status: 304 })
  response.headers.set('Cache-Control', CACHE_CONTROL.PRODUCTS)
  return response
}

// Middleware helper for adding cache headers
export function addCacheHeaders(
  response: NextResponse,
  cacheControl: string,
  options: Omit<CacheOptions, 'cacheControl'> = {}
): NextResponse {
  response.headers.set('Cache-Control', cacheControl)
  
  if (options.etag && response.body) {
    // Note: This is a simplified ETag generation
    // In production, you might want to use a more sophisticated approach
    const etag = generateETag(response.body)
    response.headers.set('ETag', etag)
  }
  
  if (options.lastModified) {
    response.headers.set('Last-Modified', options.lastModified.toUTCString())
  }
  
  if (options.vary && options.vary.length > 0) {
    response.headers.set('Vary', options.vary.join(', '))
  }
  
  return response
}

// Cache invalidation headers
export function addCacheInvalidationHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', CACHE_CONTROL.NO_CACHE)
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

// Compression helpers
export function shouldCompress(request: Request): boolean {
  const acceptEncoding = request.headers.get('Accept-Encoding') || ''
  return acceptEncoding.includes('gzip') || acceptEncoding.includes('br')
}

export function getCompressionType(request: Request): string | null {
  const acceptEncoding = request.headers.get('Accept-Encoding') || ''
  
  if (acceptEncoding.includes('br')) {
    return 'br'
  } else if (acceptEncoding.includes('gzip')) {
    return 'gzip'
  }
  
  return null
}