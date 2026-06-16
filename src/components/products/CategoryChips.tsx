'use client'

import { memo, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Category } from '@/src/types/plp'

interface CategoryChipsProps {
  categories: Category[]
  selected: string | undefined
  onSelect: (slug: string | undefined) => void
}

export const CategoryChips = memo(function CategoryChips({
  categories,
  selected,
  onSelect,
}: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 200
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }, [])

  return (
    <div className="sticky top-[57px] z-40 bg-white/70 backdrop-blur-md border-b border-neutral-100">
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-white/90 to-transparent md:hidden"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-neutral-500" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2.5 -webkit-overflow-scrolling:touch"
        >
          <button
            onClick={() => onSelect(undefined)}
            className={`shrink-0 h-8 px-3.5 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap ${
              !selected
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(selected === cat.slug ? undefined : cat.slug)}
              className={`shrink-0 h-8 px-3.5 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                selected === cat.slug
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-white/90 to-transparent md:hidden"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </button>
      </div>
    </div>
  )
})
