'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  // Core auth states
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  
  // Profile completion state
  hasCompletedProfile: boolean;
  profile: Profile | null;
  
  // Wallet state
  hasWallet: boolean;
  
  // Social accounts
  socialAccounts: SocialAccount[];
  
  // Actions
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithTwitter: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

interface Profile {
  id: string;
  wallet_public_key?: string;
  handle: string;
  name: string;
  birthday: string;
  gender: string;
  pronouns?: string;
  interests: string[];
  photos: string[];
  created_at: string;
  updated_at: string;
}

interface SocialAccount {
  id: string;
  provider: 'google' | 'twitter';
  provider_user_id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  verified: boolean;
  created_at: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (profileData) {
        setProfile(profileData);
        setHasCompletedProfile(true);
        setHasWallet(!!profileData.wallet_public_key);
      } else {
        setHasCompletedProfile(false);
        setHasWallet(false);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  // Fetch social accounts
  const fetchSocialAccounts = async (userId: string) => {
    try {
      const { data: socialData, error: socialError } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', userId);

      if (socialError) {
        console.error('Error fetching social accounts:', socialError);
        return;
      }

      setSocialAccounts(socialData || []);
    } catch (error) {
      console.error('Error in fetchSocialAccounts:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session) {
          setUser(session.user);
          setSession(session);
          setIsAuthenticated(true);
          
          await fetchProfile(session.user.id);
          await fetchSocialAccounts(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session) {
          setUser(session.user);
          setSession(session);
          setIsAuthenticated(true);
          
          await fetchProfile(session.user.id);
          await fetchSocialAccounts(session.user.id);
        } else {
          setUser(null);
          setSession(null);
          setIsAuthenticated(false);
          setHasCompletedProfile(false);
          setHasWallet(false);
          setProfile(null);
          setSocialAccounts([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Social login functions
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      return { error };
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      return { error: error as AuthError };
    }
  };

  const signInWithTwitter = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      return { error };
    } catch (error) {
      console.error('Error in signInWithTwitter:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Error in signOut:', error);
      return { error: error as AuthError };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await fetchSocialAccounts(user.id);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    session,
    hasCompletedProfile,
    profile,
    hasWallet,
    socialAccounts,
    signInWithGoogle,
    signInWithTwitter,
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
