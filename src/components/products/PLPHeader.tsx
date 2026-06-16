'use client'

import { memo, useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, ShoppingBag, Heart, ArrowLeft } from 'lucide-react'
import { useCart } from '@/src/context/CartContext'

interface PLPHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  title?: string
  showBack?: boolean
}

export const PLPHeader = memo(function PLPHeader({
  searchQuery,
  onSearchChange,
  title,
  showBack = false,
}: PLPHeaderProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const { summary } = useCart()

  const cartCount = summary?.item_count ?? 0

  const handleClear = useCallback(() => {
    onSearchChange('')
    inputRef.current?.focus()
  }, [onSearchChange])

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors -ml-1"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </button>
          )}

          {!showBack && title && (
            <h1 className="text-lg font-semibold text-neutral-900 shrink-0">
              {title}
            </h1>
          )}

          <div
            className={`flex-1 relative transition-all duration-200 ${
              focused ? 'flex-[2]' : ''
            }`}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search cases..."
              className="w-full h-9 pl-9 pr-8 text-sm bg-neutral-100 rounded-full border-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-neutral-400"
              aria-label="Search products"
            />
            {searchQuery && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Link
            href="/wishlist"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors relative"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5 text-neutral-600" />
          </Link>

          <Link
            href="/cart"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors relative"
            aria-label="Shopping cart"
          >
            <ShoppingBag className="w-5 h-5 text-neutral-600" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-blue-600 text-white text-[9px] font-bold rounded-full leading-none">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
})
