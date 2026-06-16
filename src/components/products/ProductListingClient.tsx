'use client'

import { memo, useState, useMemo, useCallback } from 'react'
import { useInfiniteScroll } from '@/src/hooks/useInfiniteScroll'
import { useProductListing } from '@/src/hooks/useProductListing'
import { useCategories } from '@/src/hooks/useCategories'
import { PLPHeader } from './PLPHeader'
import { CategoryChips } from './CategoryChips'
import { FilterSortBar } from './FilterSortBar'
import { PLPProductGrid } from './PLPProductGrid'
import { PLPEmptyState, PLPNoResults, PLPErrorState } from './PLPStateViews'
import type { SortOption } from './FilterSortBar'

interface ProductListingClientProps {
  initialCategory?: string
}

export const ProductListingClient = memo(function ProductListingClient({
  initialCategory,
}: ProductListingClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialCategory)
  const [sortOption, setSortOption] = useState<SortOption>('newest')

  const filters = useMemo(() => {
    const f: Record<string, string> = {}
    if (selectedCategory) f.category = selectedCategory
    if (searchQuery) f.search = searchQuery
    if (sortOption === 'price-low') { f.sortBy = 'price'; f.sortOrder = 'asc' }
    else if (sortOption === 'price-high') { f.sortBy = 'price'; f.sortOrder = 'desc' }
    else if (sortOption === 'name') { f.sortBy = 'name'; f.sortOrder = 'asc' }
    return f
  }, [selectedCategory, searchQuery, sortOption])

  const {
    products,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isError,
    error,
    fetchNextPage,
    refetch,
  } = useProductListing(filters)

  const { data: categories = [] } = useCategories()

  const loadMoreRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  const handleCategoryChange = useCallback((slug: string | undefined) => {
    setSelectedCategory(slug)
  }, [])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortOption(sort)
  }, [])

  const handleFilterClick = useCallback(() => {
    // TODO: Open filter bottom sheet / modal
  }, [])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedCategory) count++
    return count
  }, [selectedCategory])

  const showNoResults = !isLoading && !isError && products.length === 0 && searchQuery.length >= 2
  const showEmpty = !isLoading && !isError && products.length === 0 && !showNoResults

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <PLPHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        title="Cases"
      />

      <CategoryChips
        categories={categories}
        selected={selectedCategory}
        onSelect={handleCategoryChange}
      />

      <FilterSortBar
        activeFiltersCount={activeFiltersCount}
        currentSort={sortOption}
        onSortChange={handleSortChange}
        onFilterClick={handleFilterClick}
      />

      {isError && (
        <PLPErrorState
          onRetry={() => refetch()}
          message={error instanceof Error ? error.message : undefined}
        />
      )}

      {showNoResults && (
        <PLPNoResults
          searchQuery={searchQuery}
          onClearSearch={handleClearSearch}
        />
      )}

      {showEmpty && <PLPEmptyState />}

      {!isError && products.length > 0 && (
        <PLPProductGrid
          products={products}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          loadMoreRef={loadMoreRef}
        />
      )}

      {isLoading && products.length === 0 && (
        <PLPProductGrid
          products={[]}
          isLoading={true}
          isFetchingNextPage={false}
          loadMoreRef={loadMoreRef}
        />
      )}
    </div>
  )
})
