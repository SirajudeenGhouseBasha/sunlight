'use client'

import { useState, useMemo, useCallback } from 'react'

interface ProductFilters {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'name' | 'price' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

interface UseOptimizedFiltersProps {
  initialFilters?: Partial<ProductFilters>
}

export function useOptimizedFilters({ 
  initialFilters = {} 
}: UseOptimizedFiltersProps = {}) {
  const [filters, setFilters] = useState<ProductFilters>(initialFilters)

  // Memoized active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.category) count++
    if (filters.search) count++
    if (filters.minPrice !== undefined) count++
    if (filters.maxPrice !== undefined) count++
    if (filters.sortBy && filters.sortBy !== 'created_at') count++
    return count
  }, [filters])

  // Memoized filter query string for API calls
  const filterQuery = useMemo(() => {
    const params = new URLSearchParams()
    
    if (filters.category) params.append('category', filters.category)
    if (filters.search) params.append('search', filters.search)
    if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString())
    if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString())
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
    
    return params.toString()
  }, [filters])

  // Memoized filter object for React Query keys
  const filterKey = useMemo(() => {
    return Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  }, [filters])

  // Optimized filter update callbacks
  const updateFilter = useCallback(<K extends keyof ProductFilters>(
    key: K, 
    value: ProductFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilter = useCallback((key: keyof ProductFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({})
  }, [])

  const resetToInitial = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  // Specific filter callbacks for common use cases
  const setCategory = useCallback((category: string | undefined) => {
    updateFilter('category', category)
  }, [updateFilter])

  const setSearch = useCallback((search: string | undefined) => {
    updateFilter('search', search)
  }, [updateFilter])

  const setPriceRange = useCallback((minPrice?: number, maxPrice?: number) => {
    setFilters(prev => ({ ...prev, minPrice, maxPrice }))
  }, [])

  const setSorting = useCallback((sortBy: ProductFilters['sortBy'], sortOrder: ProductFilters['sortOrder'] = 'asc') => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }))
  }, [])

  // Memoized filter state
  const filterState = useMemo(() => ({
    hasActiveFilters: activeFiltersCount > 0,
    activeFiltersCount,
    isEmpty: Object.keys(filterKey).length === 0,
  }), [activeFiltersCount, filterKey])

  return {
    // Current filters
    filters,
    filterKey,
    filterQuery,
    filterState,
    
    // Generic actions
    updateFilter,
    updateFilters,
    clearFilter,
    clearAllFilters,
    resetToInitial,
    
    // Specific actions
    setCategory,
    setSearch,
    setPriceRange,
    setSorting,
  }
}