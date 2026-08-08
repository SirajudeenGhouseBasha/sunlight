/**
 * Admin Dashboard
 *
 * Hub page: quick navigation cards for every admin section so admins can
 * jump straight from the dashboard to any management area.
 */

import Link from 'next/link';
import {
  ShoppingCart,
  Factory,
  Printer,
  Tags,
  Smartphone,
  Package,
  Palette,
  Sparkles,
  Images,
  Users,
  Settings,
  ChevronRight,
} from 'lucide-react';

const sections = [
  { href: '/admin/orders', name: 'Orders', description: 'View and manage customer orders, verify UPI payments', icon: ShoppingCart },
  { href: '/admin/production-orders', name: 'Production Orders', description: 'Track the production pipeline across all states', icon: Factory },
  { href: '/admin/print-queue', name: 'Print Queue', description: 'Process and manage pending print jobs', icon: Printer },
  { href: '/admin/brands', name: 'Brands', description: 'Manage smartphone brands', icon: Tags },
  { href: '/admin/models', name: 'Models', description: 'Manage phone models', icon: Smartphone },
  { href: '/admin/product-types', name: 'Product Types', description: 'Manage product types and base pricing', icon: Package },
  { href: '/admin/custom-case', name: 'Custom Designed Case', description: 'Manage custom designed case variants', icon: Palette },
  { href: '/admin/predesigned-case', name: 'Predesigned Case', description: 'Manage predesigned case variants', icon: Sparkles },
  { href: '/admin/predesigned', name: 'Predesigned Catalogue', description: 'Manage the predesigned cases catalogue', icon: Images },
  { href: '/admin/users', name: 'Users', description: 'Manage user accounts', icon: Users },
  { href: '/admin/payment-settings', name: 'Payment Settings', description: 'Configure UPI payment details', icon: Settings },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Welcome back</h2>
          <p className="text-sm text-gray-500">Jump into any management area from here.</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 active:bg-orange-200 transition-colors shrink-0"
        >
          Back to Store
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map(({ href, name, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-orange-200 active:bg-orange-50/50 transition-all duration-150"
          >
            <div className="w-11 h-11 shrink-0 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
