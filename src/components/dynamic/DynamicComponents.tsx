'use client'

import dynamic from 'next/dynamic'

// Heavy components with dynamic imports and loading states

// Design Editor - Large component, client-only
export const DesignEditor = dynamic(
  () => import('../design/DesignEditor').then(mod => ({ default: mod.DesignEditor })),
  {
    loading: () => (
      <div className="w-full h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading Design Editor...</p>
        </div>
      </div>
    ),
    ssr: false, // Client-only component
  }
)

// Admin Panel - Separate chunk for admin functionality
export const AdminPanel = dynamic(
  () => import('../admin/AdminPanel'),
  {
    loading: () => (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    ),
  }
)

// Product Modal - Lazy loaded modal
export const ProductModal = dynamic(
  () => import('../modals/ProductModal'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    ),
  }
)

// Cart Drawer - Lazy loaded
export const CartDrawer = dynamic(
  () => import('../cart/CartDrawer'),
  {
    loading: () => (
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  }
)

// Search Modal - Lazy loaded
export const SearchModal = dynamic(
  () => import('../search/SearchModal'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
          <div className="p-4 animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  }
)

// Image Gallery - Heavy component
export const ImageGallery = dynamic(
  () => import('../gallery/ImageGallery'),
  {
    loading: () => (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    ),
  }
)

// Chart Components - Heavy visualization libraries
export const SalesChart = dynamic(
  () => import('../charts/SalesChart'),
  {
    loading: () => (
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading Chart...</p>
      </div>
    ),
    ssr: false,
  }
)

export const AnalyticsChart = dynamic(
  () => import('../charts/AnalyticsChart'),
  {
    loading: () => (
      <div className="h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading Analytics...</p>
      </div>
    ),
    ssr: false,
  }
)

// Rich Text Editor - Heavy component
export const RichTextEditor = dynamic(
  () => import('../editor/RichTextEditor'),
  {
    loading: () => (
      <div className="border rounded-lg">
        <div className="h-12 bg-gray-100 border-b animate-pulse" />
        <div className="h-32 bg-gray-50 animate-pulse" />
      </div>
    ),
    ssr: false,
  }
)

// File Upload Component - Heavy with drag & drop
export const FileUploadZone = dynamic(
  () => import('../upload/FileUploadZone'),
  {
    loading: () => (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center animate-pulse">
        <div className="w-12 h-12 bg-gray-200 rounded mx-auto mb-4" />
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2" />
        <div className="h-3 bg-gray-200 rounded w-32 mx-auto" />
      </div>
    ),
  }
)