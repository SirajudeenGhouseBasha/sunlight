interface PredesignedSkeletonProps {
  count?: number
}

function PredesignedCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200" />
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
        
        {/* Color and Category */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded-full" />
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="w-1 h-1 bg-gray-200 rounded-full" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        
        {/* Tags */}
        <div className="flex gap-1">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
        
        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  )
}

export function PredesignedGridSkeleton({ count = 12 }: PredesignedSkeletonProps) {
  return (
    <div>
      {/* Results Count Skeleton */}
      <div className="mb-6">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <PredesignedCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}