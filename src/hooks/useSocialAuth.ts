import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { generateMnemonic } from 'bip39';
import type { SocialAccount } from '@/types/social';

interface UseSocialAuthOptions {
  walletOverride?: string;
  isConnectedOverride?: boolean;
}

export function useSocialAuth(options?: UseSocialAuthOptions) {
  const { wallet: walletFromHook, isConnected: isConnectedFromHook, createWallet: createWalletFromHook } = useWallet();
  
  // Use provided wallet or fall back to wallet from hook
  const wallet = options?.walletOverride ?? walletFromHook;
  const isConnected = options?.walletOverride ? true : isConnectedFromHook;
  
  const [linkedAccounts, setLinkedAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's linked social accounts
  const fetchLinkedAccounts = useCallback(async () => {
    // If no wallet is provided, we can't fetch accounts
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
    } catch (err) {
      console.error('Error fetching social accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      setLinkedAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  // Connect Twitter account with real OAuth
  const connectTwitter = async () => {
    // If no wallet is provided, generate a temporary one
    let walletToUse = wallet;
    if (!walletToUse) {
      try {
        const mnemonic = generateMnemonic();
        const tempWallet = createWalletFromHook(mnemonic);
        walletToUse = tempWallet.publicKey;
      } catch (err) {
        const error = new Error('Failed to prepare connection');
        setError('Unable to initialize connection. Please try again.');
        throw error;
      }
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social-connect/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet: walletToUse, action: 'connect' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to initiate Twitter connection';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Twitter OAuth
        window.location.href = data.authUrl;
        return { redirecting: true };
      }

      // Refresh the linked accounts if mock connection
      await fetchLinkedAccounts();
      return data;
    } catch (err) {
      console.error('Error connecting Twitter:', err);
      const userFriendlyError = getSocialAuthErrorMessage(err, 'Twitter');
      setError(userFriendlyError);
      throw new Error(userFriendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect Gmail account with real OAuth
  const connectGmail = async () => {
    // If no wallet is provided, generate a temporary one
    let walletToUse = wallet;
    if (!walletToUse) {
      try {
        const mnemonic = generateMnemonic();
        const tempWallet = createWalletFromHook(mnemonic);
        walletToUse = tempWallet.publicKey;
      } catch (err) {
        const error = new Error('Failed to prepare connection');
        setError('Unable to initialize connection. Please try again.');
        throw error;
      }
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social-connect/gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet: walletToUse, action: 'connect' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to initiate Gmail connection';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Gmail OAuth
        window.location.href = data.authUrl;
        return { redirecting: true };
      }

      // Refresh the linked accounts if mock connection
      await fetchLinkedAccounts();
      return data;
    } catch (err) {
      console.error('Error connecting Gmail:', err);
      const userFriendlyError = getSocialAuthErrorMessage(err, 'Gmail');
      setError(userFriendlyError);
      throw new Error(userFriendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate user-friendly error messages
  const getSocialAuthErrorMessage = (error: unknown, provider: string): string => {
    if (error instanceof Error) {
      if (error.message.includes('not configured')) {
        return `${provider} OAuth is not properly configured. Please contact support or try again later.`;
      }
      if (error.message.includes('wallet')) {
        return 'Wallet connection is not required for this operation.';
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return `Network error connecting to ${provider}. Please check your internet connection and try again.`;
      }
      if (error.message.includes('redirect') || error.message.includes('URI')) {
        return `${provider} redirect failed. Please ensure the app is properly configured.`;
      }
      return error.message;
    }
    return `Unable to connect ${provider}. Please try again later.`;
  };

  // Mock connection for testing (fallback)
  const connectTwitterMock = async () => {
    // If no wallet is provided, generate a temporary one
    let walletToUse = wallet;
    if (!walletToUse) {
      try {
        const mnemonic = generateMnemonic();
        const tempWallet = createWalletFromHook(mnemonic);
        walletToUse = tempWallet.publicKey;
      } catch (err) {
        const error = new Error('Failed to prepare connection');
        setError('Unable to initialize connection. Please try again.');
        throw error;
      }
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social-connect/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet: walletToUse, action: 'mock' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to connect Twitter';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      await fetchLinkedAccounts();
      return data;
    } catch (err) {
      console.error('Error connecting Twitter (mock):', err);
      const userFriendlyError = getSocialAuthErrorMessage(err, 'Twitter');
      setError(userFriendlyError);
      throw new Error(userFriendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const connectGmailMock = async () => {
    // If no wallet is provided, generate a temporary one
    let walletToUse = wallet;
    if (!walletToUse) {
      try {
        const mnemonic = generateMnemonic();
        const tempWallet = createWalletFromHook(mnemonic);
        walletToUse = tempWallet.publicKey;
      } catch (err) {
        const error = new Error('Failed to prepare connection');
        setError('Unable to initialize connection. Please try again.');
        throw error;
      }
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social-connect/gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet: walletToUse, action: 'mock' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to connect Gmail';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      await fetchLinkedAccounts();
      return data;
    } catch (err) {
      console.error('Error connecting Gmail (mock):', err);
      const userFriendlyError = getSocialAuthErrorMessage(err, 'Gmail');
      setError(userFriendlyError);
      throw new Error(userFriendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove social account
  const removeSocialAccount = async (provider: 'twitter' | 'gmail') => {
    // If no wallet is provided, this operation cannot be performed
    if (!wallet) {
      const error = new Error('Wallet required for account removal');
      setError('Wallet is required to remove social account');
      throw error;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/social-accounts/remove`, {
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
    } catch (err) {
      console.error(`Error removing ${provider} account:`, err);
      setError(err instanceof Error ? err.message : `Failed to remove ${provider} account`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has at least one linked account
  const hasLinkedAccount = linkedAccounts.length > 0;

  // Check if specific provider is connected
  const isProviderConnected = (provider: 'twitter' | 'gmail') => {
    return linkedAccounts.some(account => account.provider === provider);
  };

  // Fetch accounts when wallet connects
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
    connectTwitterMock,
    connectGmailMock,
    removeSocialAccount,
  };
}