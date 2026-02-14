'use client';

import { usePathname } from 'next/navigation';

/**
 * The "$PINDER IS LIVE" scrolling ticker that appears at the bottom of every page.
 * Skips the homepage since it has its own identical footer ticker.
 */
export function GlobalTicker() {
  const pathname = usePathname();

  // Homepage already renders its own ticker
  if (pathname === '/') return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 ticker z-40">
      <div className="overflow-hidden">
        <div className="ticker-content whitespace-nowrap">
          <span className="inline-block">
            <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE //
          </span>
          <span className="inline-block">
            <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE //
          </span>
        </div>
      </div>
    </footer>
  );
}
