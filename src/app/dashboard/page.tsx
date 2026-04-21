/**
 * Dashboard Page Component
 * 
 * Main user dashboard after authentication - Mobile-First Design
 * Requirements: 3.4 - Protected route with user interface
 */

import { requireAuth } from '@/src/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {user.full_name || user.email}!</p>
            </div>
            <div className="flex space-x-2">
              <Link href="/profile">
                <Button variant="outline" size="sm">Profile</Button>
              </Link>
              <form action="/auth/logout" method="post">
                <Button variant="outline" size="sm" type="submit">Sign Out</Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6 sm:px-6">
        <div className="space-y-6">
          
          {/* Quick Actions - Mobile First */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Get started with your phone case design</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/designs/create" className="block">
                <Button className="w-full h-12 text-base font-medium">
                  🎨 Create New Design
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/products" className="block">
                  <Button variant="outline" className="w-full h-11 text-sm">
                    📱 Browse Cases
                  </Button>
                </Link>
                <Link href="/cart" className="block">
                  <Button variant="outline" className="w-full h-11 text-sm">
                    🛒 View Cart
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders - Mobile Optimized */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <CardDescription>Your latest phone case orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-gray-500 mb-4">No orders yet</p>
                <Link href="/products">
                  <Button variant="outline" className="h-11">Start Shopping</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* My Designs - Mobile Optimized */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">My Designs</CardTitle>
              <CardDescription>Your custom phone case designs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎨</div>
                <p className="text-gray-500 mb-4">No designs yet</p>
                <Link href="/designs/create">
                  <Button variant="outline" className="h-11">Create Design</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Account Info - Mobile Optimized */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Account Information</CardTitle>
              <CardDescription>Your account details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Profile</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Name</span>
                    <span className="font-medium">{user.full_name || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-xs">{user.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Role</span>
                    <span className="font-medium capitalize">{user.role}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Quick Links</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/profile">
                    <Button variant="outline" className="w-full h-11 text-sm">
                      Edit Profile
                    </Button>
                  </Link>
                  <Link href="/orders">
                    <Button variant="outline" className="w-full h-11 text-sm">
                      Order History
                    </Button>
                  </Link>
                  <Link href="/designs">
                    <Button variant="outline" className="w-full h-11 text-sm">
                      My Designs
                    </Button>
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin">
                      <Button variant="outline" className="w-full h-11 text-sm">
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}