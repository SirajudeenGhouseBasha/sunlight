'use client'

import { memo } from 'react'
import { PackageOpen, SearchX, AlertCircle, RefreshCw } from 'lucide-react'

interface EmptyStateProps {
  message?: string
}

export const PLPEmptyState = memo(function PLPEmptyState({
  message = 'No products available yet.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <PackageOpen className="w-7 h-7 text-neutral-400" />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">
        Nothing here yet
      </h3>
      <p className="text-sm text-neutral-500 max-w-xs">{message}</p>
    </div>
  )
})

interface NoResultsProps {
  searchQuery: string
  onClearSearch: () => void
}

export const PLPNoResults = memo(function PLPNoResults({
  searchQuery,
  onClearSearch,
}: NoResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <SearchX className="w-7 h-7 text-neutral-400" />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">
        No results for &ldquo;{searchQuery}&rdquo;
      </h3>
      <p className="text-sm text-neutral-500 max-w-xs mb-6">
        Try checking your spelling or using a different search term.
      </p>
      <button
        onClick={onClearSearch}
        className="h-10 px-5 text-sm font-medium rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
      >
        Clear search
      </button>
    </div>
  )
})

interface ErrorStateProps {
  onRetry: () => void
  message?: string
}

export const PLPErrorState = memo(function PLPErrorState({
  onRetry,
  message = 'Something went wrong while loading products.',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">
        Failed to load
      </h3>
      <p className="text-sm text-neutral-500 max-w-xs mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="h-10 px-5 text-sm font-medium rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors inline-flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  )
})
