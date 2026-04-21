'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useProductSearch } from '@/src/lib/queries/products'

interface UseOptimizedSearchProps {
  debounceMs?: number
  minQueryLength?: number
}

export function useOptimizedSearch({ 
  debounceMs = 300, 
  minQueryLength = 2 
}: UseOptimizedSearchProps = {}) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // Memoized search enabled condition
  const searchEnabled = useMemo(() => {
    return debouncedQuery.length >= minQueryLength
  }, [debouncedQuery, minQueryLength])

  // Use the search query
  const searchResult = useProductSearch(debouncedQuery, searchEnabled)

  // Memoized filtered results
  const filteredResults = useMemo(() => {
    if (!searchResult.data) return []
    
    // Additional client-side filtering if needed
    return searchResult.data.filter(product => 
      product.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    )
  }, [searchResult.data, debouncedQuery])

  // Memoized search stats
  const searchStats = useMemo(() => ({
    totalResults: filteredResults.length,
    hasResults: filteredResults.length > 0,
    isSearching: searchResult.isFetching,
    hasError: !!searchResult.error,
  }), [filteredResults.length, searchResult.isFetching, searchResult.error])

  // Optimized callbacks
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery)
  }, [])

  const clearSearch = useCallback(() => {
    setQuery('')
    setDebouncedQuery('')
  }, [])

  return {
    query,
    debouncedQuery,
    results: filteredResults,
    stats: searchStats,
    handleQueryChange,
    clearSearch,
    isLoading: searchResult.isLoading,
    error: searchResult.error,
  }
}