'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';

export function MainNav() {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '/predesigned', label: 'Predesigned', highlight: true },
    { href: '/custom-case', label: 'Custom', highlight: true },
    { href: '/products', label: 'Browse' },
    { href: '/cart', label: 'Cart' },
    { href: '/orders', label: 'Orders' },
    { href: '/dashboard/designs', label: 'Designs', auth: true },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Admin' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

  return (
    <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');

      :root {
        --nav-bg: rgba(255, 255, 255, 0.7);
        --nav-bg-scrolled: rgba(255, 255, 255, 0.95);
        --text-primary: #0a0a0a;
        --text-secondary: #666;
        --border-color: rgba(0, 0, 0, 0.06);
        --border-color-scrolled: rgba(0, 0, 0, 0.1);
        --accent: #0a0a0a;
        --highlight-bg: rgba(0, 0, 0, 0.04);
      }

      .nav-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 50;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .nav-container.scrolled {
        --nav-bg: var(--nav-bg-scrolled);
        --border-color: var(--border-color-scrolled);
      }

      .nav-inner {
        backdrop-filter: blur(12px);
        background: var(--nav-bg);
        border-bottom: 1px solid var(--border-color);
        padding: 0 1.5rem;
      }

      .nav-content {
        max-width: 1440px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 4.5rem;
        gap: 2rem;
      }

      .nav-logo {
        font-family: 'Space Mono', monospace;
        font-size: 0.875rem;
        font-weight: 700;
        letter-spacing: 0.15em;
        color: var(--text-primary);
        text-decoration: none;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transition: all 0.3s ease;
      }

      .nav-logo:hover {
        letter-spacing: 0.25em;
      }

      .logo-icon {
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .nav-links {
        display: none;
        gap: 0.5rem;
        align-items: center;
        flex: 1;
        justify-content: center;
      }

      .nav-links.desktop {
        display: flex;
      }

      .nav-link {
        position: relative;
        font-family: 'Inter', sans-serif;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-secondary);
        text-decoration: none;
        padding: 0.5rem 0.875rem;
        transition: all 0.3s ease;
        letter-spacing: 0.3px;
        border-radius: 2px;
      }

      .nav-link::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: var(--accent);
        transform: scaleX(0);
        transform-origin: right;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .nav-link:hover {
        color: var(--text-primary);
      }

      .nav-link:hover::before {
        transform: scaleX(1);
        transform-origin: left;
      }

      .nav-link.active {
        color: var(--text-primary);
        background: var(--highlight-bg);
      }

      .nav-link.active::before {
        transform: scaleX(1);
      }

      .nav-link.highlight {
        font-weight: 600;
      }

      .nav-link.highlight.active {
        background: var(--text-primary);
        color: white;
      }

      .nav-link.highlight.active::before {
        display: none;
      }

      .nav-divider {
        width: 1px;
        height: 1.25rem;
        background: var(--border-color);
        margin: 0 0.5rem;
      }

      .nav-right {
        display: none;
        align-items: center;
        gap: 1.5rem;
        white-space: nowrap;
      }

      .nav-right.desktop {
        display: flex;
      }

      .nav-auth-btn {
        font-family: 'Inter', sans-serif;
        font-size: 0.8125rem;
        font-weight: 500;
        padding: 0.5rem 1rem;
        border: none;
        background: none;
        cursor: pointer;
        text-decoration: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        letter-spacing: 0.3px;
        border-radius: 2px;
        color: var(--text-secondary);
      }

      .nav-auth-btn:hover {
        color: var(--text-primary);
      }

      .nav-auth-btn.signin {
        background: var(--text-primary);
        color: white;
        padding: 0.5rem 1.25rem;
      }

      .nav-auth-btn.signin:hover {
        background: var(--text-primary);
        opacity: 0.9;
        transform: translateY(-1px);
      }

      .nav-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border: none;
        background: none;
        cursor: pointer;
        padding: 0;
        transition: all 0.3s ease;
      }

      .nav-toggle:hover {
        background: var(--highlight-bg);
      }

      .nav-toggle svg {
        width: 1.25rem;
        height: 1.25rem;
        color: var(--text-primary);
        transition: all 0.3s ease;
      }

      .mobile-menu {
        display: none;
        position: fixed;
        top: 4.5rem;
        left: 0;
        right: 0;
        background: var(--nav-bg-scrolled);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border-color-scrolled);
        overflow: hidden;
        z-index: 49;
      }

      .mobile-menu.open {
        display: block;
        animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .mobile-menu-content {
        padding: 1.5rem;
        space-y: 1rem;
        max-width: 1440px;
        margin: 0 auto;
      }

      .mobile-menu-item {
        display: block;
        font-family: 'Inter', sans-serif;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-secondary);
        text-decoration: none;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--border-color);
        transition: all 0.3s ease;
        letter-spacing: 0.3px;
      }

      .mobile-menu-item:last-child {
        border-bottom: none;
      }

      .mobile-menu-item:hover {
        color: var(--text-primary);
        padding-left: 0.5rem;
      }

      .mobile-menu-item.active {
        color: var(--text-primary);
        font-weight: 600;
      }

      .mobile-menu-item.highlight.active {
        background: var(--text-primary);
        color: white;
        padding: 0.5rem 0.75rem;
        margin: 0 -0.75rem;
      }

      .mobile-auth-section {
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-color);
        margin-top: 1.5rem;
      }

      .mobile-auth-btn {
        display: block;
        width: 100%;
        font-family: 'Inter', sans-serif;
        font-size: 0.8125rem;
        font-weight: 500;
        padding: 0.75rem;
        border: none;
        background: var(--text-primary);
        color: white;
        cursor: pointer;
        text-decoration: none;
        text-align: center;
        border-radius: 2px;
        transition: all 0.3s ease;
        letter-spacing: 0.3px;
      }

      .mobile-auth-btn:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      .mobile-auth-btn.signout {
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
      }

      .mobile-auth-btn.signout:hover {
        color: var(--text-primary);
      }

      /* Responsive */
      @media (max-width: 1024px) {
        .nav-links.desktop,
        .nav-right.desktop {
          display: none;
        }

        .nav-toggle {
          display: flex;
        }
      }

      @media (max-width: 640px) {
        .nav-inner {
          padding: 0 1rem;
        }

        .nav-content {
          height: 3.5rem;
        }

        .logo-icon {
          font-size: 1rem;
        }

        .nav-logo {
          font-size: 0.75rem;
        }
      }
    `}</style>

    <nav className={`nav-container ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <div className="nav-content">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            <span className="logo-icon">📱</span>
            <span>SUNLIGHT</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="nav-links desktop">
            {navLinks.map((link) => {
              if (link.auth && !isAuthenticated) return null;
              const active = isActive(link.href);

              return (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`nav-link ${active ? 'active' : ''} ${
                      link.highlight ? 'highlight' : ''
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}

            {isAdmin &&
              adminLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`nav-link ${isActive(link.href) ? 'active' : ''}`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
          </div>

          {/* Divider */}
          <div className="nav-divider" />

          {/* Right Section */}
          <div className="nav-right desktop">
            {isAuthenticated ? (
              <button onClick={handleSignOut} className="nav-auth-btn">
                Sign Out
              </button>
            ) : (
              <Link href="/auth/login">
                <button className="nav-auth-btn signin">Sign In</button>
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {mobileMenuOpen ? (
                <>
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              ) : (
                <>
                  <path
                    d="M3 6h18M3 12h18M3 18h18"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          {navLinks.map((link) => {
            if (link.auth && !isAuthenticated) return null;
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span
                  className={`mobile-menu-item ${active ? 'active' : ''} ${
                    link.highlight ? 'highlight' : ''
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}

          {isAdmin &&
            adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className={`mobile-menu-item ${isActive(link.href) ? 'active' : ''}`}>
                  {link.label}
                </span>
              </Link>
            ))}

          <div className="mobile-auth-section">
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="mobile-auth-btn signout"
              >
                Sign Out
              </button>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                <button className="mobile-auth-btn">Sign In</button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}