'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

/** Fetches the live SOL/USD price every 30 s and exposes helpers. */
export function useSolPrice() {
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(COINGECKO_URL, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const price = data?.solana?.usd;
      if (typeof price === 'number' && price > 0) {
        setSolPrice(price);
        setIsLoading(false);
      }
    } catch {
      // silently retry on next tick
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    intervalRef.current = setInterval(fetchPrice, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPrice]);

  /** Convert a USD amount into SOL at the current live price. Returns `null` while price is loading. */
  const usdToSol = useCallback(
    (usd: number): number | null => {
      if (!solPrice) return null;
      return parseFloat((usd / solPrice).toFixed(6));
    },
    [solPrice],
  );

  return { solPrice, isLoading, usdToSol };
}
