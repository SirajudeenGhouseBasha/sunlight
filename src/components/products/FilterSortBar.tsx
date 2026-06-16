'use client'

import { memo, useState, useRef, useEffect } from 'react'
import { SlidersHorizontal, ArrowUpDown, Check } from 'lucide-react'

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name' },
]

interface FilterSortBarProps {
  activeFiltersCount: number
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
  onFilterClick: () => void
}

export const FilterSortBar = memo(function FilterSortBar({
  activeFiltersCount,
  currentSort,
  onSortChange,
  onFilterClick,
}: FilterSortBarProps) {
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentLabel = SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? 'Sort'

  return (
    <div className="sticky top-[101px] z-30 bg-white/70 backdrop-blur-md border-b border-neutral-100">
      <div className="flex items-center justify-between px-4 py-2.5">
        <button
          onClick={onFilterClick}
          className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors relative"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 flex items-center justify-center bg-blue-600 text-white text-[9px] font-bold rounded-full leading-none">
              {activeFiltersCount}
            </span>
          )}
        </button>

        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen((prev) => !prev)}
            className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{currentLabel}</span>
            <span className="sm:hidden">Sort</span>
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden z-50">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value)
                    setSortOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors text-left"
                >
                  <span>{option.label}</span>
                  {currentSort === option.value && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export type { SortOption }
