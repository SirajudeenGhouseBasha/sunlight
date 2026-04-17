import { redirect } from 'next/navigation'
import { LogOut, Sun, User, Settings, BarChart3, Calendar, Bell } from 'lucide-react'
import { createClient } from '@/src/lib/supabase/server'
import { logoutAction } from '@/src/actions/auth/logout'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* ══════════════════════════════════════════════════════════════════
          Header Navigation
      ══════════════════════════════════════════════════════════════════ */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container-wide flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
              <Sun className="w-4 h-4 text-background" />
            </div>
            <span className="text-xl font-semibold text-foreground">Sunlight</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#overview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Overview
            </a>
            <a href="#analytics" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Analytics
            </a>
            <a href="#settings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Settings
            </a>
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </Button>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm" className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          Main Content
      ══════════════════════════════════════════════════════════════════ */}
      <main className="py-8">
        <div className="container-wide space-y-8">
          
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-foreground">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your account today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Projects
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">12</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last month
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Tasks
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">24</div>
                <p className="text-xs text-muted-foreground">
                  8 due this week
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Team Members
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">8</div>
                <p className="text-xs text-muted-foreground">
                  +1 new this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* User Profile Card */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-background" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-foreground">Your Profile</CardTitle>
                    <CardDescription>Manage your account settings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="text-sm font-mono bg-muted rounded-lg px-3 py-2 break-all text-foreground">
                    {user.email}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <div className="text-xs font-mono bg-muted rounded-lg px-3 py-2 break-all text-muted-foreground">
                    {user.id}
                  </div>
                </div>
                <Button variant="outline" className="w-full gap-2">
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3 h-12">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">View Analytics</div>
                    <div className="text-xs text-muted-foreground">Check your performance metrics</div>
                  </div>
                </Button>

                <Button variant="outline" className="w-full justify-start gap-3 h-12">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">Schedule Meeting</div>
                    <div className="text-xs text-muted-foreground">Book time with your team</div>
                  </div>
                </Button>

                <Button variant="outline" className="w-full justify-start gap-3 h-12">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">Account Settings</div>
                    <div className="text-xs text-muted-foreground">Manage preferences and security</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Status Card */}
          <Card className="border-dashed border-border bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto">
                  <Sun className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-foreground">Authentication Working</h3>
                <p className="text-sm text-muted-foreground">
                  🎉 Your Supabase authentication is properly configured. This is your protected dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}