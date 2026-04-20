/**
 * Main Navigation Component
 * 
 * Mobile-first navigation with category browsing
 * Requirements: 12.1, 12.5 - Navigation and category browsing
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { useAuth } from '@/src/hooks/useAuth';

export function MainNav() {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '/products', label: 'Browse', icon: '🛍️' },
    { href: '/cart', label: 'Cart', icon: '🛒' },
    { href: '/orders', label: 'Orders', icon: '📦' },
    { href: '/dashboard/designs', label: 'My Designs', icon: '🎨', auth: true },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Admin', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/products" className="flex items-center space-x-2">
            <span className="text-2xl">📱</span>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              Phone Cases
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => {
              if (link.auth && !isAuthenticated) return null;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
            
            {isAdmin && adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}

            {isAuthenticated ? (
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            {navLinks.map((link) => {
              if (link.auth && !isAuthenticated) return null;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-md text-base font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
            
            {isAdmin && adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-md text-base font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}

            <div className="px-4 pt-2">
              {isAuthenticated ? (
                <Button onClick={handleSignOut} variant="outline" className="w-full">
                  Sign Out
                </Button>
              ) : (
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
