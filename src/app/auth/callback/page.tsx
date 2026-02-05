'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError('Authentication failed. Please try again.');
          return;
        }

        if (data.session) {
          // Create or update social account record
          const user = data.session.user;
          const provider = user.app_metadata?.provider;
          
          if (provider && (provider === 'google' || provider === 'twitter')) {
            const socialAccountData = {
              user_id: user.id,
              provider: provider,
              provider_user_id: user.id,
              email: user.email,
              username: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url,
              verified: user.email_confirmed_at ? true : false,
            };

            // Upsert social account
            const { error: socialError } = await supabase
              .from('social_accounts')
              .upsert(socialAccountData, {
                onConflict: 'user_id,provider',
              });

            if (socialError) {
              console.error('Error creating social account:', socialError);
            }
          }

          // Refresh profile data
          await refreshProfile();
          
          // Redirect based on profile completion
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (profile) {
            router.push('/swipe');
          } else {
            router.push('/onboarding');
          }
        } else {
          setError('No session found. Please try logging in again.');
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [router, refreshProfile]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-500/20 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-white hover:bg-white/90 text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}
