'use client'

import { memo, useCallback, useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, ShoppingBag, Heart, ArrowLeft, TrendingUp, Loader2 } from 'lucide-react'
import { useCart } from '@/src/context/CartContext'

interface PLPHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  title?: string
  showBack?: boolean
}

interface Suggestion {
  type: 'product' | 'brand'
  id: string
  name: string
  subtitle?: string
  image_url?: string
  price?: number
}

export const PLPHeader = memo(function PLPHeader({
  searchQuery,
  onSearchChange,
  title,
  showBack = false,
}: PLPHeaderProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const { summary } = useCart()

  const cartCount = summary?.item_count ?? 0

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.products?.map((p: any) => ({
            type: 'product' as const,
            id: p.id,
            name: p.name,
            subtitle: p.brand_name ? `${p.brand_name} - ${p.color_name || ''}` : p.color_name,
            image_url: p.image_url,
            price: p.price,
          })) || [])
          setShowSuggestions(true)
        }
      } catch {
        // ignore
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClear = useCallback(() => {
    onSearchChange('')
    inputRef.current?.focus()
    setSuggestions([])
    setShowSuggestions(false)
  }, [onSearchChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      const s = suggestions[selectedIndex]
      if (s) {
        setShowSuggestions(false)
        onSearchChange('')
        router.push(`/products/${s.id}`)
      }
    }
  }

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

          <div ref={wrapperRef} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value)
                setSelectedIndex(-1)
              }}
              onFocus={() => {
                setFocused(true)
                if (suggestions.length > 0) setShowSuggestions(true)
              }}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Search cases by brand, model..."
              className="w-full h-9 pl-9 pr-8 text-sm bg-neutral-100 rounded-full border-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-neutral-400"
              aria-label="Search products"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 animate-spin" />
            )}
            {!searchLoading && searchQuery && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Live Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50">
                <div className="p-2 border-b border-neutral-100">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <TrendingUp className="w-3 h-3" />
                    <span>Live search results</span>
                  </div>
                </div>
                {suggestions.map((s, i) => (
                  <Link
                    key={s.id}
                    href={`/products/${s.id}`}
                    onClick={() => {
                      setShowSuggestions(false)
                      onSearchChange('')
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 transition-colors ${
                      i === selectedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    {s.image_url && (
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                        <img
                          src={s.image_url}
                          alt={s.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{s.name}</p>
                      {s.subtitle && (
                        <p className="text-xs text-neutral-500 truncate">{s.subtitle}</p>
                      )}
                    </div>
                    {s.price != null && (
                      <span className="text-sm font-semibold text-neutral-900 shrink-0">
                        ₹{s.price.toFixed(2)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
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
