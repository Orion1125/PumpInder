'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from './useWallet';

export interface UserProfileData {
  handle: string;
  birthday: string;
  gender: string;
  interests: string[];
  photos: string[];
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { wallet } = useWallet();

  useEffect(() => {
    const loadProfile = async () => {
      if (!wallet?.publicKey) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('handle, birthday, gender, interests, photos')
          .eq('wallet_public_key', wallet.publicKey)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading user profile:', error);
        } else if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [wallet?.publicKey]);

  const getProfilePicture = () => {
    return profile?.photos[0] || null;
  };

  const saveProfile = async (profileData: UserProfileData) => {
    if (!wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          wallet_public_key: wallet.publicKey,
          ...profileData,
        }, {
          onConflict: 'wallet_public_key'
        });

      if (error) {
        throw error;
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  return {
    profile,
    isLoading,
    getProfilePicture,
    hasProfilePicture: !!profile?.photos[0],
    saveProfile,
  };
}
