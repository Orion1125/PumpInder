'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { getTokenBalanceChecker, TokenBalance } from '@/lib/spl';

export interface BalanceState {
  balances: TokenBalance[];
  totalBalanceUSD: number;
  pinderBalance: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBalance(): BalanceState {
  const { wallet, isConnected } = useWallet();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState(0);
  const [pinderBalance, setPinderBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!wallet || !isConnected) {
      setBalances([]);
      setTotalBalanceUSD(0);
      setPinderBalance(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const checker = getTokenBalanceChecker();
      const tokenBalances = await checker.getTokenBalances(wallet.publicKey);
      
      setBalances(tokenBalances);
      
      // Calculate PINDER balance (if PINDER token exists)
      const pinderToken = tokenBalances.find(t => t.token === 'PINDER');
      setPinderBalance(pinderToken?.balance || 0);
      
      // For now, we'll assume 1 PINDER = 1 USD for simplicity
      // In a real app, you'd fetch actual prices from an oracle
      const totalUSD = tokenBalances.reduce((sum, token) => {
        if (token.token === 'PINDER') {
          return sum + token.balance; // Assuming 1:1 ratio
        }
        // For USDC/USDT, they're already USD-pegged
        return sum + token.balance;
      }, 0);
      
      setTotalBalanceUSD(totalUSD);
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError('Failed to fetch wallet balances');
      setBalances([]);
      setTotalBalanceUSD(0);
      setPinderBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [wallet, isConnected]);

  useEffect(() => {
    if (wallet && isConnected) {
      fetchBalances();
    } else {
      setBalances([]);
      setTotalBalanceUSD(0);
      setPinderBalance(0);
      setIsLoading(false);
      setError(null);
    }
  }, [wallet, isConnected, fetchBalances]);

  return {
    balances,
    totalBalanceUSD,
    pinderBalance,
    isLoading,
    error,
    refetch: fetchBalances,
  };
}
