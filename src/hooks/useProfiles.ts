'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';

export interface DiscoverProfile {
  id: string;
  walletPublicKey: string;
  handle: string;
  birthday: string;
  gender: string;
  interests: string[];
  photos: string[];
  bio: string;
  location: string;
  occupation: string;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, isConnected } = useWallet();

  const fetchProfiles = useCallback(async () => {
    if (!publicKey || !isConnected) {
      setProfiles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/profiles/discover?wallet=${publicKey}`);
      if (!res.ok) {
        throw new Error('Failed to fetch profiles');
      }
      const data = await res.json();
      setProfiles(data.profiles || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, isConnected]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const removeProfile = (walletKey: string) => {
    setProfiles((prev) => prev.filter((p) => p.walletPublicKey !== walletKey));
  };

  /** Move a profile to the bottom of the array (used on pass / left-swipe). */
  const rotateProfileToBottom = (walletKey: string) => {
    setProfiles((prev) => {
      const idx = prev.findIndex((p) => p.walletPublicKey === walletKey);
      if (idx < 0) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.push(moved);
      return copy;
    });
  };

  return { profiles, isLoading, error, removeProfile, rotateProfileToBottom, refetch: fetchProfiles };
}
