import { requireAuth } from '@/src/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import Link from 'next/link';
import { Palette, Smartphone, ShoppingCart, Package, User, Settings, LogOut, LayoutDashboard } from 'lucide-react';

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 sm:px-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-500">Welcome back, {user.full_name || user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm h-9 gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>
              <form action="/auth/logout" method="post">
                <Button variant="outline" size="sm" type="submit" className="text-xs sm:text-sm h-9 gap-1.5">
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 max-w-6xl mx-auto">
        <div className="space-y-5 sm:space-y-6">
          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Get started with your phone case design</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/designs/create">
                <Button className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium gap-2">
                  <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                  Create New Design
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/products">
                  <Button variant="outline" className="w-full h-11 text-xs sm:text-sm gap-2">
                    <Smartphone className="w-4 h-4" />
                    Browse Cases
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button variant="outline" className="w-full h-11 text-xs sm:text-sm gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    View Cart
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {/* Recent Orders */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Recent Orders</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Your latest phone case orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 sm:py-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-4">No orders yet</p>
                  <Link href="/products">
                    <Button variant="outline" className="h-10 text-xs sm:text-sm">Start Shopping</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* My Designs */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">My Designs</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Your custom phone case designs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 sm:py-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Palette className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-4">No designs yet</p>
                  <Link href="/designs/create">
                    <Button variant="outline" className="h-10 text-xs sm:text-sm">Create Design</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Account Information</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your account details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 sm:space-y-6">
              <div>
                <div className="space-y-1 text-xs sm:text-sm bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-gray-900">{user.full_name || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-900 truncate ml-2">{user.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Role</span>
                    <span className="font-medium capitalize text-gray-900">{user.role}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link href="/profile">
                    <Button variant="outline" className="w-full h-11 text-xs sm:text-sm gap-2">
                      <User className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </Link>
                  <Link href="/orders">
                    <Button variant="outline" className="w-full h-11 text-xs sm:text-sm gap-2">
                      <Package className="w-4 h-4" />
                      Orders
                    </Button>
                  </Link>
                  <Link href="/dashboard/designs">
                    <Button variant="outline" className="w-full h-11 text-xs sm:text-sm gap-2">
                      <Palette className="w-4 h-4" />
                      My Designs
                    </Button>
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin">
                      <Button variant="outline" className="w-full h-11 text-xs sm:text-sm gap-2">
                        <Settings className="w-4 h-4" />
                        Admin
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
