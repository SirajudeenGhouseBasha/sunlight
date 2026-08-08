'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MainNav } from './MainNav';

const HIDE_HEADER_PATHS = [
  '/admin',
  '/auth',
  '/login',
  '/register',
];

export function SiteHeader() {
  const pathname = usePathname();
  const shouldHide = HIDE_HEADER_PATHS.some(p => pathname?.startsWith(p));

  useEffect(() => {
    document.body.classList.toggle('no-main-nav', shouldHide);
    return () => document.body.classList.remove('no-main-nav');
  }, [shouldHide]);

  if (shouldHide) return null;

  return <MainNav />;
}
