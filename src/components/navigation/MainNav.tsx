'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';

export function MainNav() {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide navbar
        setIsVisible(false);
      } else {
        // Scrolling up - show navbar
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

        :root {
          --bg-orange: #ff6b35;
          --bg-orange-dark: #e55a24;
          --text-light: #ffffff;
          --text-muted: rgba(255, 255, 255, 0.75);
          --accent-primary: #ffffff;
          --border-subtle: rgba(255, 255, 255, 0.12);
          --border-hover: rgba(255, 255, 255, 0.2);
        }

        * {
          box-sizing: border-box;
        }

        .nav-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 1rem 1.5rem;
          transition: transform 0.3s ease, opacity 0.3s ease;
          opacity: 1;
          transform: translateY(0);
        }

        .nav-wrapper.hidden {
          transform: translateY(-120%);
          opacity: 0;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .nav-wrapper {
            padding: 0.75rem 1rem;
          }
        }

        .nav-container {
          max-width: 1440px;
          margin: 0 auto;
          background: #ff6b35;
          border: none;
          border-radius: 50px;
          backdrop-filter: blur(12px);
          background-image: none;
          box-shadow: 0 4px 20px rgba(255, 107, 53, 0.2);
          padding: 0.75rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          height: auto;
          min-height: 3.5rem;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }



        /* Logo */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .logo-icon {
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .nav-logo:hover .logo-icon {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }

        .logo-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--text-light);
          text-transform: uppercase;
        }

        /* Center Links */
        .nav-links {
          display: none;
          gap: 0.25rem;
          align-items: center;
          flex: 1;
          justify-content: center;
        }

        .nav-links.desktop {
          display: flex;
        }

        .nav-link {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.8125rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          padding: 0.5rem 0.875rem;
          border-radius: 24px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          letter-spacing: 0.3px;
          position: relative;
        }

        .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.15);
        }

        .nav-link.active {
          color: white;
          background: rgba(255, 255, 255, 0.2);
        }

        .nav-link.highlight:not(.active) {
          font-weight: 600;
        }

        .nav-link.highlight.active {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          font-weight: 600;
          box-shadow: none;
        }

        .nav-link.highlight.active:hover {
          background: rgba(255, 255, 255, 0.35);
        }

        /* Divider */
        .nav-divider {
          width: 1px;
          height: 1.5rem;
          background: rgba(255, 255, 255, 0.2);
          display: none;
        }

        .nav-divider.desktop {
          display: block;
        }

        /* Right Section */
        .nav-right {
          display: none;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .nav-right.desktop {
          display: flex;
        }

        .nav-user-btn {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: transparent;
          color: white;
          cursor: pointer;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          transition: all 0.3s ease;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        .nav-user-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border-color: rgba(255, 255, 255, 0.5);
        }

        .nav-auth-btn {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.5rem 1.125rem;
          border: none;
          background: rgba(255, 255, 255, 0.95);
          color: #ff6b35;
          cursor: pointer;
          border-radius: 24px;
          transition: all 0.3s ease;
          letter-spacing: 0.3px;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
        }

        .nav-auth-btn:hover {
          background: white;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(255, 255, 255, 0.3);
        }

        /* Mobile Toggle */
        .nav-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: transparent;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .nav-toggle:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .nav-toggle svg {
          width: 1.125rem;
          height: 1.125rem;
          color: white;
          stroke-width: 2;
        }

        /* Mobile Menu */
        .mobile-menu {
          display: none;
          position: fixed;
          top: 5.5rem;
          left: 1.5rem;
          right: 1.5rem;
          background: #ff6b35;
          border: none;
          border-radius: 16px;
          backdrop-filter: blur(12px);
          overflow: hidden;
          z-index: 49;
          max-width: calc(100% - 3rem);
          box-shadow: 0 4px 20px rgba(255, 107, 53, 0.2);
        }

        .mobile-menu.open {
          display: block;
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mobile-menu-content {
          padding: 1rem;
        }

        .mobile-menu-item {
          display: block;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.8125rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          padding: 0.625rem 0.875rem;
          transition: all 0.3s ease;
          border-radius: 8px;
          letter-spacing: 0.3px;
        }

        .mobile-menu-item:hover {
          color: white;
          background: rgba(255, 255, 255, 0.15);
        }

        .mobile-menu-item.active {
          color: white;
          background: rgba(255, 255, 255, 0.2);
          font-weight: 600;
        }

        .mobile-menu-item.highlight.active {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          box-shadow: none;
        }

        .mobile-auth-section {
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .mobile-auth-btn {
          display: block;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.625rem;
          border: none;
          background: rgba(255, 255, 255, 0.95);
          color: #ff6b35;
          cursor: pointer;
          border-radius: 8px;
          text-decoration: none;
          text-align: center;
          transition: all 0.3s ease;
          letter-spacing: 0.3px;
        }

        .mobile-auth-btn:hover {
          background: white;
          transform: translateY(-1px);
        }

        .mobile-auth-btn.signout {
          background: transparent;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .mobile-auth-btn.signout:hover {
          color: white;
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.5);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .nav-links.desktop,
          .nav-divider.desktop,
          .nav-right.desktop {
            display: none;
          }

          .nav-toggle {
            display: flex;
          }

          .nav-container {
            padding: 0.5rem 1rem;
          }
        }

        @media (max-width: 640px) {
          .nav-wrapper {
            padding: 0.5rem;
          }

          .nav-container {
            padding: 0.5rem 0.875rem;
            border-radius: 40px;
            gap: 1rem;
          }

          .logo-text {
            font-size: 0.75rem;
          }

          .logo-icon {
            width: 1.75rem;
            height: 1.75rem;
            font-size: 1.25rem;
          }

          .mobile-menu {
            top: calc(2.5rem + 1rem);
            left: 0.5rem;
            right: 0.5rem;
            border-radius: 12px;
            max-width: none;
          }
        }
      `}</style>

      <div className={`nav-wrapper ${!isVisible ? 'hidden' : ''}`}>
        <nav className="nav-container">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            <span className="logo-icon">📱</span>
            <span className="logo-text">Sunlight</span>
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
          <div className="nav-divider desktop" />

          {/* Right Section */}
          <div className="nav-right desktop">
            {isAuthenticated ? (
              <button onClick={handleSignOut} className="nav-user-btn">
                Sign Out
              </button>
            ) : (
              <Link href="/auth/login">
                <button className="nav-auth-btn">Sign In</button>
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
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </>
              ) : (
                <>
                  <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
            </svg>
          </button>
        </nav>

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
      </div>
    </>
  );
}