'use client';

import { useState, useEffect } from 'react';

const ONBOARDING_STORAGE_KEY = 'pinder_onboarding_payload';

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

  useEffect(() => {
    const loadProfile = () => {
      try {
        const storedPayload = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (storedPayload) {
          const parsed = JSON.parse(storedPayload) as UserProfileData;
          setProfile(parsed);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const getProfilePicture = () => {
    return profile?.photos[0] || null;
  };

  return {
    profile,
    isLoading,
    getProfilePicture,
    hasProfilePicture: !!profile?.photos[0]
  };
}
