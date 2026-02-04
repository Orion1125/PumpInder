'use client';

import { useState, useCallback } from 'react';
import { useWallet } from './useWallet';
import { getTokenBalanceChecker } from '@/lib/spl';
import { getPaymentService, PaymentResult } from '@/lib/transactions';
import { FEE_AMOUNTS, SupportedToken } from '@/constants/tokens';

export type FeeType = 'LIKE' | 'SUPERLIKE' | 'TIP_SMALL' | 'TIP_MEDIUM' | 'TIP_LARGE';

export interface FeePaymentState {
  isLoading: boolean;
  isModalOpen: boolean;
  pendingFee: {
    type: FeeType;
    amount: number;
    token: SupportedToken;
    requiresATA: boolean;
  } | null;
  error: string | null;
  lastPayment: PaymentResult | null;
}

export function useFeePayment() {
  const [state, setState] = useState<FeePaymentState>({
    isLoading: false,
    isModalOpen: false,
    pendingFee: null,
    error: null,
    lastPayment: null,
  });

  const { getKeypair, wallet } = useWallet();

  const getFeeAmount = (type: FeeType): number => {
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

  const checkBalanceAndPreparePayment = useCallback(async (
    feeType: FeeType
  ): Promise<{ canPay: boolean; token: SupportedToken | null; requiresATA: boolean }> => {
    const userKeypair = getKeypair();
    if (!userKeypair || !wallet?.publicKey) {
      return { canPay: false, token: null, requiresATA: false };
    }

    try {
      const amount = getFeeAmount(feeType);
      const balanceChecker = getTokenBalanceChecker();
      const sufficientToken = await balanceChecker.findSufficientToken(
        wallet.publicKey,
        amount
      );

      if (!sufficientToken) {
        return { canPay: false, token: null, requiresATA: false };
      }

      const paymentService = getPaymentService();
      const simulation = await paymentService.simulatePayment({
        amount,
        token: sufficientToken.token,
        userKeypair,
      });

      return {
        canPay: true,
        token: sufficientToken.token,
        requiresATA: simulation.requiresATA,
      };
    } catch (error) {
      console.error('Error checking balance:', error);
      return { canPay: false, token: null, requiresATA: false };
    }
  }, [getKeypair, wallet?.publicKey]);

  const initiatePayment = useCallback(async (
    feeType: FeeType
  ) => {
    const userKeypair = getKeypair();
    if (!userKeypair) {
      setState(prev => ({
        ...prev,
        error: 'Wallet not connected. Please connect your wallet to continue.',
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const amount = getFeeAmount(feeType);
      const { canPay, token, requiresATA } = await checkBalanceAndPreparePayment(feeType);

      if (!canPay || !token) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Insufficient balance. Please add funds to your wallet to continue.',
        }));
        return;
      }

      // Show payment confirmation modal
      setState(prev => ({
        ...prev,
        isLoading: false,
        isModalOpen: true,
        pendingFee: {
          type: feeType,
          amount,
          token,
          requiresATA,
        },
      }));

      // Note: The actual payment will be processed in confirmPayment
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to prepare payment',
      }));
    }
  }, [getKeypair, checkBalanceAndPreparePayment]);

  const confirmPayment = useCallback(async () => {
    const { pendingFee } = state;
    if (!pendingFee || !wallet?.publicKey) return;

    const userKeypair = getKeypair();
    if (!userKeypair) {
      setState(prev => ({
        ...prev,
        error: 'Wallet not connected. Please connect your wallet to continue.',
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const paymentService = getPaymentService();
      const result = await paymentService.payServiceFee({
        amount: pendingFee.amount,
        token: pendingFee.token,
        userKeypair,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        isModalOpen: false,
        pendingFee: null,
        lastPayment: result,
        error: result.success ? null : result.error || null,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return {
        success: false,
        error: errorMessage,
        tokenUsed: pendingFee.token,
        amountPaid: pendingFee.amount,
      };
    }
  }, [wallet?.publicKey, getKeypair, state]);

  const cancelPayment = useCallback(() => {
    setState(prev => ({
      ...prev,
      isModalOpen: false,
      pendingFee: null,
      error: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const resetLastPayment = useCallback(() => {
    setState(prev => ({ ...prev, lastPayment: null }));
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    isModalOpen: state.isModalOpen,
    pendingFee: state.pendingFee,
    error: state.error,
    lastPayment: state.lastPayment,

    // Actions
    initiatePayment,
    confirmPayment,
    cancelPayment,
    clearError,
    resetLastPayment,
    checkBalanceAndPreparePayment,

    // Helpers
    getFeeAmount,
  };
}
