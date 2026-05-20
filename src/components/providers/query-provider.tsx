'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { createQueryClient } from '@/src/lib/query-client'

interface QueryProviderProps {
  children: React.ReactNode
}

/**
 * QueryProvider wraps the app with TanStack Query.
 *
 * Uses useState to create a stable QueryClient instance per component mount,
 * which is the recommended pattern for Next.js App Router to avoid sharing
 * state between requests on the server.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  )
}
