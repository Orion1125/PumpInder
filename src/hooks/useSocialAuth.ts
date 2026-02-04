'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import type { SocialAccount } from '@/types/social';

export function useSocialAuth() {
  const { wallet, isConnected } = useWallet();
  const [linkedAccounts, setLinkedAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's linked social accounts
  const fetchLinkedAccounts = useCallback(async () => {
    if (!isConnected || !wallet) {
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
  }, [isConnected, wallet]);

  // Connect Twitter account with real OAuth
  const connectTwitter = async () => {
    if (!isConnected || !wallet) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social-connect/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet, action: 'connect' }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Twitter connection');
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
      setError(err instanceof Error ? err.message : 'Failed to connect Twitter');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Connect Gmail account with real OAuth
  const connectGmail = async () => {
    if (!isConnected || !wallet) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social-connect/gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet, action: 'connect' }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Gmail connection');
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
      setError(err instanceof Error ? err.message : 'Failed to connect Gmail');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock connection for testing (fallback)
  const connectTwitterMock = async () => {
    if (!isConnected || !wallet) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social-connect/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet, action: 'mock' }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect Twitter');
      }

      const data = await response.json();
      await fetchLinkedAccounts();
      return data;
    } catch (err) {
      console.error('Error connecting Twitter (mock):', err);
      setError(err instanceof Error ? err.message : 'Failed to connect Twitter');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const connectGmailMock = async () => {
    if (!isConnected || !wallet) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social-connect/gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet, action: 'mock' }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect Gmail');
      }

      const data = await response.json();
      await fetchLinkedAccounts();
      return data;
    } catch (err) {
      console.error('Error connecting Gmail (mock):', err);
      setError(err instanceof Error ? err.message : 'Failed to connect Gmail');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove social account
  const removeSocialAccount = async (provider: 'twitter' | 'gmail') => {
    if (!isConnected || !wallet) {
      throw new Error('Wallet not connected');
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
    if (isConnected && wallet) {
      fetchLinkedAccounts();
    } else {
      setLinkedAccounts([]);
    }
  }, [isConnected, wallet, fetchLinkedAccounts]);

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