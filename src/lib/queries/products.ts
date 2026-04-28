import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS, STALE_TIME, GC_TIME } from './config'

// Types
interface Product {
  id: string
  name: string
  price: number
  image_url: string
  category: string
  description?: string
  active: boolean
  created_at: string
}

interface ProductFilters {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    hasMore: boolean
    total?: number
  }
}

// API functions
async function fetchProducts(filters?: ProductFilters): Promise<Product[]> {
  const params = new URLSearchParams()
  if (filters?.category) params.append('category', filters.category)
  if (filters?.search) params.append('search', filters.search)
  if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString())
  if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
  
  const response = await fetch(`/api/products?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch products')
  }
  
  const result = await response.json()
  return result.data || result
}

async function fetchProductsPaginated(
  filters?: ProductFilters,
  page = 0,
  limit = 20
): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  if (filters?.category) params.append('category', filters.category)
  if (filters?.search) params.append('search', filters.search)
  if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString())
  if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
  
  const response = await fetch(`/api/products?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch products')
  }
  
  return response.json()
}

async function fetchProduct(id: string): Promise<Product> {
  const response = await fetch(`/api/products/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch product')
  }
  
  return response.json()
}

async function fetchFeaturedProducts(): Promise<Product[]> {
  const response = await fetch('/api/products/featured')
  if (!response.ok) {
    throw new Error('Failed to fetch featured products')
  }
  
  const result = await response.json()
  return result.data || result
}

async function fetchRelatedProducts(productId: string): Promise<Product[]> {
  const response = await fetch(`/api/products/${productId}/related`)
  if (!response.ok) {
    throw new Error('Failed to fetch related products')
  }
  
  const result = await response.json()
  return result.data || result
}

// Query hooks
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.productList(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: STALE_TIME.PRODUCTS,
    gcTime: GC_TIME.PRODUCTS,
  })
}

export function useInfiniteProducts(filters?: ProductFilters, limit = 20) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.productList(filters), 'infinite'],
    queryFn: ({ pageParam = 0 }) => fetchProductsPaginated(filters, pageParam, limit),
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    staleTime: STALE_TIME.PRODUCTS,
    gcTime: GC_TIME.PRODUCTS,
    initialPageParam: 0,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.productDetail(id),
    queryFn: () => fetchProduct(id),
    staleTime: STALE_TIME.PRODUCTS,
    gcTime: GC_TIME.PRODUCTS,
    enabled: !!id,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: [...QUERY_KEYS.products, 'featured'],
    queryFn: fetchFeaturedProducts,
    staleTime: STALE_TIME.PRODUCTS,
    gcTime: GC_TIME.PRODUCTS,
  })
}

export function useRelatedProducts(productId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.products, 'related', productId],
    queryFn: () => fetchRelatedProducts(productId),
    staleTime: STALE_TIME.PRODUCTS,
    gcTime: GC_TIME.PRODUCTS,
    enabled: !!productId,
  })
}

// Prefetch hook for performance optimization
export function usePrefetchProduct() {
  const queryClient = useQueryClient()
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.productDetail(id),
      queryFn: () => fetchProduct(id),
      staleTime: STALE_TIME.PRODUCTS,
    })
  }
}

// Search hook with debouncing
export function useProductSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.productSearch(query),
    queryFn: () => fetchProducts({ search: query }),
    staleTime: STALE_TIME.SEARCH,
    gcTime: GC_TIME.SEARCH,
    enabled: enabled && query.length >= 2, // Only search if query is at least 2 characters
  })
}