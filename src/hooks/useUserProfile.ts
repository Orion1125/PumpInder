'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';

export interface UserProfileData {
  handle: string;
  birthday: string;
  gender: string;
  interests: string[];
  photos: string[];
  bio?: string;
  location?: string;
  occupation?: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { publicKey, isConnected } = useWallet();

  const loadProfile = useCallback(async () => {
    if (!publicKey || !isConnected) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/profiles/${publicKey}`);
      if (res.ok) {
        const data = await res.json();
        setProfile({
          handle: data.profile.handle,
          birthday: data.profile.birthday,
          gender: data.profile.gender,
          interests: data.profile.interests || [],
          photos: data.profile.photos || [],
          bio: data.profile.bio || '',
          location: data.profile.location || '',
          occupation: data.profile.occupation || '',
        });
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, isConnected]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const getProfilePicture = () => {
    return profile?.photos?.[0] || null;
  };

  const saveProfile = async (profileData: UserProfileData) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    const res = await fetch(`/api/profiles/${publicKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save profile');
    }

    const data = await res.json();
    setProfile({
      handle: data.profile.handle,
      birthday: data.profile.birthday,
      gender: data.profile.gender,
      interests: data.profile.interests || [],
      photos: data.profile.photos || [],
      bio: data.profile.bio || '',
      location: data.profile.location || '',
      occupation: data.profile.occupation || '',
    });
  };

  return {
    profile,
    isLoading,
    getProfilePicture,
    hasProfilePicture: !!profile?.photos?.[0],
    saveProfile,
    refreshProfile: loadProfile,
  };
}
