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
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);

  const walletAddress = publicKey?.toBase58() ?? null;
  const isAuthenticated = connected && !!walletAddress;

  // Check for existing session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('mypinder_session');
    if (savedSession) {
      try {
        const { walletAddress: savedWallet, expiry } = JSON.parse(savedSession);
        const now = Date.now();
        if (now < expiry && savedWallet) {
          setSessionExpiry(expiry);
          // If we have a saved session, we'll try to reconnect
          console.log('Found valid session, expiry:', new Date(expiry));
        } else {
          localStorage.removeItem('mypinder_session');
        }
      } catch (error) {
        localStorage.removeItem('mypinder_session');
      }
    }
  }, []);

  const saveSession = useCallback((wallet: string) => {
    const expiry = Date.now() + (5 * 60 * 1000); // 5 minutes from now
    setSessionExpiry(expiry);
    localStorage.setItem('mypinder_session', JSON.stringify({
      walletAddress: wallet,
      expiry
    }));
  }, []);

  const clearSession = useCallback(() => {
    setSessionExpiry(null);
    localStorage.removeItem('mypinder_session');
  }, []);

  // Check for session expiry every minute
  useEffect(() => {
    const checkSessionExpiry = () => {
      if (sessionExpiry && Date.now() > sessionExpiry) {
        console.log('Session expired, clearing...');
        clearSession();
        setProfile(null);
        setHasCompletedProfile(false);
        // Optionally disconnect wallet here if desired
        // disconnect();
      }
    };

    const interval = setInterval(checkSessionExpiry, 60000); // Check every minute
    checkSessionExpiry(); // Check immediately

    return () => clearInterval(interval);
  }, [sessionExpiry, clearSession]);

  const fetchProfile = useCallback(async (wallet: string) => {
    try {
      const res = await fetch(`/api/profiles/${wallet}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setHasCompletedProfile(true);
        saveSession(wallet); // Save session when profile is successfully loaded
      } else {
        setProfile(null);
        setHasCompletedProfile(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setHasCompletedProfile(false);
    }
  }, [saveSession]);

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
    clearSession();
  }, [disconnect, clearSession]);

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
