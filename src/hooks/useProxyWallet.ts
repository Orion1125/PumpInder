'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { useWallet } from './useWallet';

export interface ProxyWalletState {
  proxyPublicKey: string | null;
  proxyBalanceSol: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const resolveEndpoint = () => {
  if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  }

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  if (network === 'devnet' || network === 'testnet') {
    return clusterApiUrl(network);
  }

  return clusterApiUrl('mainnet-beta');
};

export function useProxyWallet(): ProxyWalletState {
  const { publicKey, isConnected } = useWallet();
  const [proxyPublicKey, setProxyPublicKey] = useState<string | null>(null);
  const [proxyBalanceSol, setProxyBalanceSol] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRefreshingRef = useRef(false);

  const fetchProxyAddress = useCallback(async (walletAddress: string) => {
    const response = await fetch(`/api/proxy-wallet?wallet=${walletAddress}`, { cache: 'no-store' });
    const data = await response.json();

    if (!response.ok || !data?.proxyPublicKey) {
      throw new Error(data?.error || 'Failed to load proxy wallet');
    }

    const address = data.proxyPublicKey as string;
    setProxyPublicKey(address);
    return address;
  }, []);

  const fetchBalance = useCallback(async (address: string) => {
    const connection = new Connection(resolveEndpoint(), 'confirmed');
    const lamports = await connection.getBalance(new PublicKey(address));
    setProxyBalanceSol(lamports / 1_000_000_000);
  }, []);

  const refresh = useCallback(async () => {
    if (!publicKey || !isConnected) {
      setProxyPublicKey(null);
      setProxyBalanceSol(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;

    setIsLoading(true);

    try {
      const address = proxyPublicKey ?? (await fetchProxyAddress(publicKey));
      await fetchBalance(address);
      setError(null);
    } catch (err) {
      // Only surface errors when we haven't loaded the proxy address yet
      // (i.e. initial fetch). Transient balance poll failures are silent.
      if (!proxyPublicKey) {
        setError(err instanceof Error ? err.message : 'Failed to load proxy wallet');
      }
    } finally {
      isRefreshingRef.current = false;
      setIsLoading(false);
    }
  }, [publicKey, isConnected, proxyPublicKey, fetchProxyAddress, fetchBalance]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!publicKey || !isConnected) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refresh();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [publicKey, isConnected, refresh]);

  return {
    proxyPublicKey,
    proxyBalanceSol,
    isLoading,
    error,
    refresh,
  };
}
