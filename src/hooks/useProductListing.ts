'use client'

import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { PLPProduct, ProductListingFilters, ProductListingResponse } from '@/src/types/plp'
import { QUERY_KEYS, STALE_TIME, GC_TIME } from '@/src/lib/queries/config'

interface ApiResponse {
  products: Array<{
    id: string
    variant_id: string
    name: string
    brand: { id: string; name: string; slug: string; logo_url?: string | null }
    model: { id: string; name: string; slug: string; model_number?: string | null; screen_size?: string | null }
    product_type: { id: string; name: string; slug: string; base_price: number; description?: string | null; material_properties?: unknown }
    color_name: string
    color_hex: string | null
    price: number
    base_price: number
    price_modifier: number
    stock_quantity: number
    in_stock: boolean
    is_active: boolean
    image_url: string
    additional_images: string[]
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function mapApiProduct(item: ApiResponse['products'][0]): PLPProduct {
  const price = Number(item.price)
  const basePrice = Number(item.base_price)
  const priceModifier = Number(item.price_modifier)
  const discountPercent = priceModifier < 0
    ? Math.round((Math.abs(priceModifier) / basePrice) * 100)
    : null

  return {
    id: item.id,
    variant_id: item.variant_id,
    name: item.name,
    brand_name: item.brand.name,
    model_name: item.model.name,
    product_type_name: item.product_type.name,
    color_name: item.color_name,
    color_hex: item.color_hex,
    price,
    base_price: basePrice,
    price_modifier: priceModifier,
    discount_percent: discountPercent,
    image_url: item.image_url,
    additional_images: item.additional_images || [],
    stock_quantity: item.stock_quantity,
    in_stock: item.in_stock,
  }
}

async function fetchListingPage(
  filters: ProductListingFilters,
  page: number,
  limit: number,
): Promise<ProductListingResponse> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (filters.category) params.set('category', filters.category)
  if (filters.search) params.set('search', filters.search)
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)

  const res = await fetch(`/api/products?${params}`)
  if (!res.ok) throw new Error('Failed to fetch products')

  const json: ApiResponse = await res.json()
  return {
    products: json.products.map(mapApiProduct),
    pagination: {
      page: json.pagination.page,
      limit: json.pagination.limit,
      total: json.pagination.total,
      totalPages: json.pagination.totalPages,
      hasMore: json.pagination.page < json.pagination.totalPages,
    },
  }
}

export function useProductListing(filters: ProductListingFilters = {}) {
  const limit = 24

  const query = useInfiniteQuery({
    queryKey: [...QUERY_KEYS.productList(filters), 'plp'],
    queryFn: ({ pageParam }) => fetchListingPage(filters, pageParam as number, limit),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: STALE_TIME.PRODUCTS,
    gcTime: GC_TIME.PRODUCTS,
  })

  const products = useMemo(
    () => query.data?.pages.flatMap((p) => p.products) ?? [],
    [query.data],
  )

  const totalCount = query.data?.pages[0]?.pagination.total ?? 0

  return {
    products,
    totalCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isError: query.isError,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  }
}
