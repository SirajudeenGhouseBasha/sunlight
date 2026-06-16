'use client'

import { useQuery } from '@tanstack/react-query'
import type { Category } from '@/src/types/plp'

interface ApiResponse {
  product_types: Array<{
    id: string
    slug: string
    name: string
  }>
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch('/api/product-types?active=true&limit=50')
  if (!res.ok) throw new Error('Failed to fetch categories')
  const json: ApiResponse = await res.json()
  return (json.product_types || []).map((pt) => ({
    id: pt.id,
    slug: pt.slug,
    name: pt.name,
  }))
}

export function useCategories() {
  return useQuery({
    queryKey: ['product-types', 'list'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  })
}
