'use client'

import { Suspense } from 'react'
import { CartSkeleton } from '@/src/components/loading/CartSkeleton'
import { ErrorBoundary } from 'react-error-boundary'

interface CartSuspenseProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

function CartErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="text-center py-8">
      <h3 className="text-md font-semibold text-red-600 mb-2">
        Failed to load cart
      </h3>
      <p className="text-gray-600 text-sm mb-4">
        {error?.message || 'Unable to load your cart items'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Retry
      </button>
    </div>
  )
}

export function CartSuspense({ children, fallback }: CartSuspenseProps) {
  return (
    <ErrorBoundary
      FallbackComponent={CartErrorFallback}
      onReset={() => {
        // Could add cart refresh logic here
        window.location.reload()
      }}
    >
      <Suspense fallback={fallback || <CartSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}