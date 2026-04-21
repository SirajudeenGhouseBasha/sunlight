export function CartItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b">
      <div className="w-16 h-16 bg-gray-200 rounded animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-8 h-6 bg-gray-200 rounded animate-pulse" />
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}

export function CartSkeleton({ itemCount = 3 }: { itemCount?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: itemCount }).map((_, i) => (
        <CartItemSkeleton key={i} />
      ))}
      <div className="p-4 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        <div className="flex justify-between font-bold">
          <div className="h-5 bg-gray-200 rounded w-12 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
        </div>
      </div>
    </div>
  )
}