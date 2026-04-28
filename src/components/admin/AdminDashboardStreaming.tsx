import { Suspense } from 'react'

// Skeleton components for streaming
function StatCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-2" />
      <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-1" />
      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
    </div>
  )
}

function RecentActivitySkeleton() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Async components that will be streamed
async function AdminStats() {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const stats = [
    { label: 'Total Products', value: '1,234', change: '+12%' },
    { label: 'Total Orders', value: '856', change: '+8%' },
    { label: 'Revenue', value: '$45,678', change: '+15%' },
    { label: 'Active Users', value: '2,341', change: '+5%' },
  ]

  return (
    <>
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          <p className="text-sm text-green-600">{stat.change}</p>
        </div>
      ))}
    </>
  )
}

async function RecentActivity() {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const activities = [
    { id: 1, type: 'order', message: 'New order #1234 received', time: '2 minutes ago' },
    { id: 2, type: 'product', message: 'Product "iPhone Case" updated', time: '5 minutes ago' },
    { id: 3, type: 'user', message: 'New user registered', time: '10 minutes ago' },
    { id: 4, type: 'order', message: 'Order #1233 shipped', time: '15 minutes ago' },
    { id: 5, type: 'product', message: 'Product "Samsung Case" added', time: '20 minutes ago' },
  ]

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {activity.type[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AdminDashboardStreaming() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
      </div>
      
      {/* Stats Grid - Streams in first */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Suspense fallback={
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        }>
          <AdminStats />
        </Suspense>
      </div>
      
      {/* Recent Activity - Streams in second */}
      <Suspense fallback={<RecentActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  )
}