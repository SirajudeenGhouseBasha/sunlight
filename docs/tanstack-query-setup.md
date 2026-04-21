# TanStack Query Setup and Configuration

## Overview

TanStack Query has been configured for optimal performance with focus on reducing redundant API calls and improving user experience through intelligent caching and optimistic updates.

## Configuration Details

### QueryClient Configuration

The QueryClient is configured with the following performance optimizations:

- **Stale Time**: 5 minutes for most data (product catalogs, user data)
- **Garbage Collection Time**: 10 minutes to keep data in cache longer
- **Retry Logic**: Smart retry with exponential backoff, no retries on 4xx errors
- **Refetch Behavior**: Optimized for performance while maintaining data freshness

### Cache Strategy

#### Product Data
- **Regular Products**: 5-minute stale time (catalogs don't change frequently)
- **Featured Products**: 15-minute stale time (changes even less frequently)
- **Product Details**: 5-minute stale time with prefetching on hover

#### Cart Data
- **Stale Time**: 0 (always fresh for critical user data)
- **Optimistic Updates**: Immediate UI updates with rollback on failure
- **Cache Time**: 5 minutes to handle quick navigation

#### Performance Features
- **Request Deduplication**: Automatic deduplication of identical requests
- **Prefetching**: Strategic prefetching on user interactions (hover, navigation)
- **Background Refetching**: Smart background updates without blocking UI
- **Error Boundaries**: Graceful error handling with retry mechanisms

## File Structure

```
src/
├── lib/
│   ├── query-client.ts          # QueryClient configuration
│   └── queries/
│       ├── products.ts          # Product-related queries
│       ├── cart.ts             # Cart-related queries with optimistic updates
│       └── utils.ts            # Cache management utilities
├── providers/
│   └── query-provider.tsx      # App-level QueryClient provider
└── components/
    └── examples/
        └── ProductListExample.tsx # Example implementation
```

## Usage Examples

### Basic Query Usage

```typescript
import { useProducts } from '@/lib/queries/products'

function ProductList() {
  const { data, isLoading, error } = useProducts('cases')
  
  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorMessage error={error} />
  
  return <ProductGrid products={data?.data || []} />
}
```

### Optimistic Updates

```typescript
import { useAddToCart } from '@/lib/queries/cart'

function AddToCartButton({ productId }: { productId: string }) {
  const addToCart = useAddToCart()
  
  const handleClick = () => {
    addToCart.mutate({ productId, quantity: 1 })
    // UI updates immediately, rolls back on error
  }
  
  return (
    <button onClick={handleClick} disabled={addToCart.isPending}>
      {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
    </button>
  )
}
```

### Prefetching for Performance

```typescript
import { usePrefetchProduct } from '@/lib/queries/products'

function ProductCard({ product }: { product: Product }) {
  const prefetchProduct = usePrefetchProduct()
  
  return (
    <div onMouseEnter={() => prefetchProduct(product.id)}>
      {/* Product card content */}
    </div>
  )
}
```

## Performance Benefits

### Reduced API Calls
- **Cache Hit Rate**: Expected 80%+ for repeated requests
- **Request Deduplication**: Eliminates duplicate simultaneous requests
- **Background Updates**: Fresh data without blocking user interactions

### Improved User Experience
- **Optimistic Updates**: Instant feedback for user actions
- **Prefetching**: Near-instant navigation and interactions
- **Smart Loading States**: Skeleton loaders and progressive enhancement

### Network Optimization
- **Stale-While-Revalidate**: Serve cached data while fetching fresh data
- **Retry Logic**: Intelligent retry with exponential backoff
- **Error Recovery**: Graceful degradation and recovery mechanisms

## Development Tools

### React Query Devtools
- Available in development mode
- Positioned at bottom-left of screen
- Provides cache inspection and debugging capabilities

### Cache Debugging
```typescript
import { debugCache } from '@/lib/queries/utils'

// In development, log cache state
debugCache(queryClient)
```

## Best Practices

### Query Key Management
- Use query key factories for consistent cache management
- Include all relevant parameters in query keys
- Use hierarchical key structure for easy invalidation

### Error Handling
- Implement proper error boundaries
- Provide meaningful error messages
- Include retry mechanisms for network errors

### Performance Monitoring
- Monitor cache hit rates
- Track slow queries (>1s)
- Set up alerts for performance regressions

## Integration with Existing Code

The TanStack Query setup is designed to work alongside existing state management:

1. **Server State**: Managed by TanStack Query (API data, cache)
2. **Client State**: Continue using existing patterns (UI state, forms)
3. **Global State**: Can be integrated with Zustand for complex UI state

## Next Steps

1. **Migrate Existing API Calls**: Gradually replace direct fetch calls with query hooks
2. **Add More Query Patterns**: Implement queries for orders, user data, etc.
3. **Performance Monitoring**: Set up metrics to track cache performance
4. **Advanced Features**: Add infinite queries, mutations, and real-time updates

## Configuration Files

### Environment Variables
No additional environment variables required. Configuration is handled in code for better type safety and IDE support.

### TypeScript Support
Full TypeScript support with proper typing for all query hooks and data structures.

This setup provides a solid foundation for client-side caching that will significantly reduce API calls and improve user experience while maintaining data freshness and consistency.