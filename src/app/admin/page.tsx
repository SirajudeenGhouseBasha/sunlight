/**
 * Admin Dashboard Page
 * 
 * Main admin interface for managing the phone case platform
 * Requirements: 11.1 - Admin dashboard and management
 */

import { requireAdmin } from '@/src/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import Link from 'next/link';

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your phone case platform</p>
            </div>
            <div className="flex space-x-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">Back to Dashboard</Button>
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
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-xs text-gray-600">Brands</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-xs text-gray-600">Models</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-xs text-gray-600">Orders</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-xs text-gray-600">Users</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Sections */}
          <div className="space-y-4">
            
            {/* Brand & Model Management */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">📱 Brand & Model Management</CardTitle>
                <CardDescription>Manage smartphone brands and models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href="/admin/brands" className="block">
                    <Button variant="outline" className="w-full h-11 justify-start">
                      🏢 Manage Brands
                    </Button>
                  </Link>
                  <Link href="/admin/models" className="block">
                    <Button variant="outline" className="w-full h-11 justify-start">
                      📱 Manage Models
                    </Button>
                  </Link>
                </div>
                <Link href="/admin/bulk-import" className="block">
                  <Button className="w-full h-11">
                    📥 Bulk Import Models
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Product Management */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">🛍️ Product Management</CardTitle>
                <CardDescription>Manage case types, variants, and pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href="/admin/product-types" className="block">
                    <Button variant="outline" className="w-full h-11 justify-start">
                      📦 Product Types
                    </Button>
                  </Link>
                  <Link href="/admin/variants" className="block">
                    <Button variant="outline" className="w-full h-11 justify-start">
                      🎨 Variants & Colors
                    </Button>
                  </Link>
                </div>
                <Link href="/admin/predesigned" className="block">
                  <Button className="w-full h-11 bg-orange-600 hover:bg-orange-700">
                    ✨ Predesigned Cases
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">👥 User Management</CardTitle>
                <CardDescription>Manage users, roles, and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/users" className="block">
                  <Button variant="outline" className="w-full h-11 justify-start">
                    👤 Manage Users & Roles
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Order Management */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">📋 Order Management</CardTitle>
                <CardDescription>Process and track customer orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href="/admin/orders" className="block">
                    <Button variant="outline" className="w-full h-11 justify-start">
                      📋 All Orders
                    </Button>
                  </Link>
                  <Link href="/admin/orders/pending" className="block">
                    <Button variant="outline" className="w-full h-11 justify-start">
                      ⏳ Pending Orders
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Design Management */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">🎨 Design Management</CardTitle>
                <CardDescription>Manage templates and user designs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href="/admin/templates" className="block">
                    <Button variant="outline" className="w-full h-11 justify-start">
                      🖼️ Templates
                    </Button>
                  </Link>
                  <Link href="/admin/designs" className="block">
                    <Button variant="outline" className="w-full h-11 justify-start">
                      🎨 User Designs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">⚙️ System Settings</CardTitle>
                <CardDescription>Platform configuration and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href="/admin/settings" className="block">
                    <Button variant="outline" className="w-full h-11 justify-start">
                      ⚙️ General Settings
                    </Button>
                  </Link>
                  <Link href="/admin/analytics" className="block">
                    <Button variant="outline" className="w-full h-11 justify-start">
                      📊 Analytics
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}