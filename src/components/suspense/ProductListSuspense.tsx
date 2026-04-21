'use client'

import { Suspense } from 'react'
import { ProductGridSkeleton } from '@/src/components/loading/ProductSkeleton'
import { ErrorBoundary } from 'react-error-boundary'

interface ProductListSuspenseProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  skeletonCount?: number
}

function ProductListErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="text-center py-12">
      <h2 className="text-lg font-semibold text-red-600 mb-2">
        Something went wrong loading products
      </h2>
      <p className="text-gray-600 mb-4">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

export function ProductListSuspense({ 
  children, 
  fallback,
  skeletonCount = 8 
}: ProductListSuspenseProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ProductListErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={fallback || <ProductGridSkeleton count={skeletonCount} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}