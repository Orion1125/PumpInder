'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface Profile {
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
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  walletAddress: string | null;
  hasCompletedProfile: boolean;
  profile: Profile | null;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected, disconnect } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);

  const walletAddress = publicKey?.toBase58() ?? null;
  const isAuthenticated = connected && !!walletAddress;

  const fetchProfile = useCallback(async (wallet: string) => {
    try {
      const res = await fetch(`/api/profiles/${wallet}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setHasCompletedProfile(true);
      } else {
        setProfile(null);
        setHasCompletedProfile(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setHasCompletedProfile(false);
    }
  }, []);

  useEffect(() => {
    const check = async () => {
      if (!walletAddress) {
        setProfile(null);
        setHasCompletedProfile(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      await fetchProfile(walletAddress);
      setIsLoading(false);
    };

    check();
  }, [walletAddress, fetchProfile]);

  const signOut = useCallback(() => {
    disconnect();
    setProfile(null);
    setHasCompletedProfile(false);
  }, [disconnect]);

  const refreshProfile = useCallback(async () => {
    if (walletAddress) {
      await fetchProfile(walletAddress);
    }
  }, [walletAddress, fetchProfile]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    walletAddress,
    hasCompletedProfile,
    profile,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
