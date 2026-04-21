'use client';

import NextTopLoader from 'nextjs-toploader';

export function RouteLoader() {
  return (
    <NextTopLoader
      color="#f97316"
      initialPosition={0.08}
      crawlSpeed={180}
      height={3}
      crawl
      showSpinner={false}
      easing="ease"
      speed={220}
    />
  );
}
