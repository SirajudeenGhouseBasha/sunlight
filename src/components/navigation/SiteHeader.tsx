'use client';

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

  if (shouldHide) return null;

  return <MainNav />;
}
