import { QueryClient } from '@tanstack/react-query'
import { productKeys } from './products'
import { cartKeys } from './cart'

/**
 * Utility functions for cache management and query invalidation
 */

// Cache invalidation utilities
export const invalidateProductCache = (queryClient: QueryClient, productId?: string) => {
  if (productId) {
    // Invalidate specific product
    queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) })
  } else {
    // Invalidate all product queries
    queryClient.invalidateQueries({ queryKey: productKeys.all })
  }
}

export const invalidateCartCache = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: cartKeys.all })
}

// Prefetch utilities for performance optimization
export const prefetchProductList = (queryClient: QueryClient, category?: string) => {
  return queryClient.prefetchQuery({
    queryKey: productKeys.list(category),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      
      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const prefetchFeaturedProducts = (queryClient: QueryClient) => {
  return queryClient.prefetchQuery({
    queryKey: productKeys.featured(),
    queryFn: async () => {
      const response = await fetch('/api/products/featured')
      if (!response.ok) throw new Error('Failed to fetch featured products')
      return response.json()
    },
    staleTime: 15 * 60 * 1000,
  })
}

// Cache warming utilities
export const warmProductCache = async (queryClient: QueryClient) => {
  // Prefetch featured products and main categories
  await Promise.all([
    prefetchFeaturedProducts(queryClient),
    prefetchProductList(queryClient), // All products
    prefetchProductList(queryClient, 'cases'), // Popular category
    prefetchProductList(queryClient, 'accessories'), // Popular category
  ])
}

// Error handling utilities
export const isNetworkError = (error: unknown): boolean => {
  return error instanceof Error && (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('NetworkError')
  )
}

export const isServerError = (error: unknown): boolean => {
  return error instanceof Error && error.message.includes('500')
}

// Query options factory for consistent configuration
export const createQueryOptions = <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number
    gcTime?: number
    enabled?: boolean
  }
) => ({
  queryKey,
  queryFn,
  staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
  gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10 minutes default
  enabled: options?.enabled ?? true,
  retry: (failureCount: number, error: any) => {
    // Don't retry on 4xx errors
    if (error?.status >= 400 && error?.status < 500) {
      return false
    }
    return failureCount < 3
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
})

// Mutation options factory
export const createMutationOptions = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: Error, variables: TVariables) => void
  }
) => ({
  mutationFn,
  retry: (failureCount: number, error: any) => {
    if (error?.status >= 400 && error?.status < 500) {
      return false
    }
    return failureCount < 1
  },
  retryDelay: 1000,
  ...options,
})

// Performance monitoring utilities
export const logQueryPerformance = (queryKey: readonly unknown[], startTime: number) => {
  const endTime = performance.now()
  const duration = endTime - startTime
  
  if (duration > 1000) { // Log slow queries (>1s)
    console.warn(`Slow query detected:`, {
      queryKey,
      duration: `${duration.toFixed(2)}ms`,
    })
  }
}

// Cache size monitoring
export const getCacheSize = (queryClient: QueryClient) => {
  const cache = queryClient.getQueryCache()
  return {
    queryCount: cache.getAll().length,
    queries: cache.getAll().map(query => ({
      queryKey: query.queryKey,
      state: query.state.status,
      dataUpdatedAt: query.state.dataUpdatedAt,
      staleTime: query.options.staleTime,
    })),
  }
}

// Development utilities
export const debugCache = (queryClient: QueryClient) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Query Cache Debug:', getCacheSize(queryClient))
  }
}