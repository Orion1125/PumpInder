'use client';

import { useState, useCallback } from 'react';
import { useWallet } from './useWallet';
import { FEE_AMOUNTS, FEE_AMOUNTS_USD } from '@/constants/tokens';
import { useSolPrice } from './useSolPrice';

export type FeeType = 'LIKE' | 'SUPERLIKE' | 'TIP_SMALL' | 'TIP_MEDIUM' | 'TIP_LARGE';

export interface FeePaymentState {
  isLoading: boolean;
  isModalOpen: boolean;
  pendingFee: {
    type: FeeType;
    amount: number;
    usdAmount: number;
    recipientWallet: string;
    recipientProxyWallet?: string;
  } | null;
  error: string | null;
  lastPayment: {
    success: boolean;
    signature?: string;
    error?: string;
    recipientWallet: string;
    amountPaid: number;
    actionType: FeeType;
  } | null;
}

export function useFeePayment() {
  const [state, setState] = useState<FeePaymentState>({
    isLoading: false,
    isModalOpen: false,
    pendingFee: null,
    error: null,
    lastPayment: null,
  });

  const { publicKey, isConnected } = useWallet();
  const { solPrice, usdToSol } = useSolPrice();
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | null>(null);

  /** Get the USD target amount for a given fee type. */
  const getUsdAmount = (type: FeeType): number => {
    switch (type) {
      case 'LIKE':
        return FEE_AMOUNTS_USD.LIKE;
      case 'SUPERLIKE':
        return FEE_AMOUNTS_USD.SUPERLIKE;
      case 'TIP_SMALL':
        return FEE_AMOUNTS_USD.TIP.SMALL;
      case 'TIP_MEDIUM':
        return FEE_AMOUNTS_USD.TIP.MEDIUM;
      case 'TIP_LARGE':
        return FEE_AMOUNTS_USD.TIP.LARGE;
      default:
        throw new Error(`Unknown fee type: ${type}`);
    }
  };

  /** Returns the SOL fee for a type, using live price when available, otherwise static fallback. */
  const getFeeAmount = (type: FeeType): number => {
    const usd = getUsdAmount(type);
    const dynamic = usdToSol(usd);
    if (dynamic !== null) return dynamic;

    // Fallback to static amounts when price feed is unavailable
    switch (type) {
      case 'LIKE':
        return FEE_AMOUNTS.LIKE;
      case 'SUPERLIKE':
        return FEE_AMOUNTS.SUPERLIKE;
      case 'TIP_SMALL':
        return FEE_AMOUNTS.TIP.SMALL;
      case 'TIP_MEDIUM':
        return FEE_AMOUNTS.TIP.MEDIUM;
      case 'TIP_LARGE':
        return FEE_AMOUNTS.TIP.LARGE;
      default:
        throw new Error(`Unknown fee type: ${type}`);
    }
  };

  const initiatePayment = useCallback(async (feeType: FeeType, recipientWallet?: string, onSuccess?: () => void) => {
    // Store the callback so confirmPayment can invoke it
    if (onSuccess) {
      setOnSuccessCallback(() => onSuccess);
    } else {
      setOnSuccessCallback(null);
    }
    if (!publicKey || !isConnected) {
      setState(prev => ({
        ...prev,
        error: 'Wallet not connected. Please connect your Phantom wallet to continue.',
      }));
      return;
    }

    if (!recipientWallet) {
      setState(prev => ({
        ...prev,
        error: 'Recipient wallet is required for this action.',
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const amount = getFeeAmount(feeType);
      const usdAmount = getUsdAmount(feeType);

      // Resolve the recipient's proxy wallet so the user sees the real destination
      const proxyRes = await fetch(`/api/proxy-wallet?wallet=${recipientWallet}`, { cache: 'no-store' });
      const proxyData = await proxyRes.json();
      const recipientProxy = proxyData?.proxyPublicKey ?? recipientWallet;

      setState(prev => ({
        ...prev,
        isLoading: false,
        isModalOpen: true,
        pendingFee: {
          type: feeType,
          amount,
          usdAmount,
          recipientWallet,       // main wallet — used by transfer API
          recipientProxyWallet: recipientProxy, // proxy address — shown in modal
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to prepare payment',
      }));
    }
  }, [publicKey, isConnected]);

  const confirmPayment = useCallback(async () => {
    const { pendingFee } = state;
    if (!pendingFee || !publicKey) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/proxy-wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWalletPublicKey: publicKey,
          toWalletPublicKey: pendingFee.recipientWallet,
          amountSol: pendingFee.amount,
          actionType: pendingFee.type,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Payment failed');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isModalOpen: false,
        pendingFee: null,
        lastPayment: {
          success: true,
          signature: data.signature,
          recipientWallet: data.toProxyWallet || pendingFee.recipientProxyWallet || pendingFee.recipientWallet,
          amountPaid: pendingFee.amount,
          actionType: pendingFee.type,
        },
      }));

      // Fire the success callback (e.g., record the swipe)
      if (onSuccessCallback) {
        try { onSuccessCallback(); } catch { /* ignore */ }
        setOnSuccessCallback(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [publicKey, state, onSuccessCallback]);

  const cancelPayment = useCallback(() => {
    setState(prev => ({
      ...prev,
      isModalOpen: false,
      pendingFee: null,
      error: null,
    }));
    setOnSuccessCallback(null);
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const resetLastPayment = useCallback(() => {
    setState(prev => ({ ...prev, lastPayment: null }));
  }, []);

  return {
    isLoading: state.isLoading,
    isModalOpen: state.isModalOpen,
    pendingFee: state.pendingFee,
    error: state.error,
    lastPayment: state.lastPayment,
    solPrice,
    initiatePayment,
    confirmPayment,
    cancelPayment,
    clearError,
    resetLastPayment,
    getFeeAmount,
  };
}
