import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { generateMnemonic } from 'bip39';
import type { SocialAccount } from '@/types/social';

interface UseSocialAuthOptions {
  walletOverride?: string;
}

export function useSocialAuth(options?: UseSocialAuthOptions) {
  const { wallet: walletFromHook, createWallet: createWalletFromHook } = useWallet();

  const wallet = options?.walletOverride ?? walletFromHook;

  const [linkedAccounts, setLinkedAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinkedAccounts = useCallback(async () => {
    if (!wallet) {
      setLinkedAccounts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/social-accounts?wallet=${wallet}`);

      if (!response.ok) {
        throw new Error('Failed to fetch social accounts');
      }

      const data = await response.json();
      setLinkedAccounts(data.accounts || []);
    } catch (fetchError) {
      console.error('Error fetching social accounts:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch accounts');
      setLinkedAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  const connectProvider = async (provider: 'twitter' | 'gmail') => {
    let walletToUse = wallet;

    if (!walletToUse) {
      try {
        const mnemonic = generateMnemonic();
        const tempWallet = createWalletFromHook(mnemonic);
        walletToUse = tempWallet.publicKey;
      } catch {
        const initError = new Error('Failed to prepare connection');
        setError('Unable to initialize connection. Please try again.');
        throw initError;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/social-connect/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet: walletToUse }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to initiate ${provider} connection`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
        return { redirecting: true };
      }

      await fetchLinkedAccounts();
      return data;
    } catch (connectError) {
      console.error(`Error connecting ${provider}:`, connectError);
      const userFriendlyError = getSocialAuthErrorMessage(connectError, provider === 'twitter' ? 'Twitter' : 'Gmail');
      setError(userFriendlyError);
      throw new Error(userFriendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const getSocialAuthErrorMessage = (socialError: unknown, provider: string): string => {
    if (socialError instanceof Error) {
      if (socialError.message.includes('not configured')) {
        return `${provider} OAuth is not properly configured. Please contact support or try again later.`;
      }
      if (socialError.message.includes('wallet')) {
        return 'Wallet connection is not required for this operation.';
      }
      if (socialError.message.includes('network') || socialError.message.includes('fetch')) {
        return `Network error connecting to ${provider}. Please check your internet connection and try again.`;
      }
      if (socialError.message.includes('redirect') || socialError.message.includes('URI')) {
        return `${provider} redirect failed. Please ensure the app is properly configured.`;
      }
      return socialError.message;
    }

    return `Unable to connect ${provider}. Please try again later.`;
  };

  const connectTwitter = async () => connectProvider('twitter');

  const connectGmail = async () => connectProvider('gmail');

  const removeSocialAccount = async (provider: 'twitter' | 'gmail') => {
    if (!wallet) {
      const walletError = new Error('Wallet required for account removal');
      setError('Wallet is required to remove social account');
      throw walletError;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social-accounts/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet, provider }),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove ${provider} account`);
      }

      await fetchLinkedAccounts();
    } catch (removeError) {
      console.error(`Error removing ${provider} account:`, removeError);
      setError(removeError instanceof Error ? removeError.message : `Failed to remove ${provider} account`);
      throw removeError;
    } finally {
      setIsLoading(false);
    }
  };

  const hasLinkedAccount = linkedAccounts.length > 0;

  const isProviderConnected = (provider: 'twitter' | 'gmail') => {
    return linkedAccounts.some((account) => account.provider === provider);
  };

  useEffect(() => {
    if (wallet) {
      fetchLinkedAccounts();
    } else {
      setLinkedAccounts([]);
    }
  }, [wallet, fetchLinkedAccounts]);

  return {
    linkedAccounts,
    isLoading,
    error,
    hasLinkedAccount,
    isProviderConnected,
    fetchLinkedAccounts,
    connectTwitter,
    connectGmail,
    removeSocialAccount,
  };
}
