'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Wraps page content with a slide-up + fade entrance animation.
 * Re-triggers on every pathname change.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [pathname]);

  return (
    <div key={animKey} className="animate-page-enter">
      {children}
    </div>
  );
}
