'use client';

import { useState } from 'react';
import { X, Twitter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthenticationModal({
  isOpen,
  onClose,
}: AuthenticationModalProps) {
  const [isConnecting, setIsConnecting] = useState<'twitter' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { signInWithGoogle, signInWithTwitter } = useAuth();

  const handleConnectTwitter = async () => {
    setIsConnecting('twitter');
    setError(null);
    
    try {
      const { error } = await signInWithTwitter();
      if (error) {
        setError('Failed to connect Twitter. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsConnecting(null);
    }
  };

  const handleConnectGoogle = async () => {
    setIsConnecting('google');
    setError(null);
    
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError('Failed to connect Google. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsConnecting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Connect to PumpInder
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Description */}
          <div className="text-center space-y-2">
            <p className="text-white/70 text-sm">
              Choose a social account to sign in. No wallet required.
            </p>
            <p className="text-white/50 text-xs">
              We only use this for authentication. You can create a wallet later for on-chain actions.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Connect options */}
          <div className="space-y-3">
            <button
              onClick={handleConnectGoogle}
              disabled={isConnecting !== null}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed text-gray-900 rounded-lg px-4 py-3 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" className="w-5 h-5">
                <path
                  fill="#4285F4"
                  d="M21.35 11.1H12v3.78h5.35c-.24 1.18-1.4 3.47-5.35 3.47-3.23 0-5.85-2.65-5.85-5.9s2.62-5.9 5.85-5.9c1.85 0 3.09.79 3.8 1.45l2.59-2.49C16.57 3.75 14.46 2.9 12 2.9 6.98 2.9 2.9 6.98 2.9 12s4.08 9.1 9.1 9.1c5.21 0 8.63-3.65 8.63-8.78 0-.5-.09-1.07-.28-1.22Z"
                />
                <path fill="#34A853" d="M12 22c2.43 0 4.48-.8 5.97-2.17l-2.83-2.19c-.79.55-1.8.89-3.14.89-2.41 0-4.45-1.62-5.18-3.8H3.9v2.39C5.39 19.92 8.43 22 12 22Z" />
                <path fill="#FBBC05" d="M6.82 14.73c-.19-.59-.3-1.21-.3-1.86 0-.65.11-1.27.3-1.86V8.62H3.9A9.09 9.09 0 0 0 3 12c0 1.18.21 2.31.9 3.38z" />
                <path fill="#EA4335" d="M12 7.37c1.32 0 2.35.45 3.07 1.04l2.3-2.24C16.47 4.96 14.43 4 12 4 8.43 4 5.39 6.08 3.9 9.27l2.92 2.34C7.55 8.99 9.59 7.37 12 7.37Z" />
              </svg>
              {isConnecting === 'google' ? 'Connecting...' : 'Continue with Google'}
            </button>

            <button
              onClick={handleConnectTwitter}
              disabled={isConnecting !== null}
              className="w-full flex items-center justify-center gap-3 bg-black hover:bg-black/80 disabled:bg-black/50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 transition-colors"
            >
              <Twitter className="w-5 h-5" />
              {isConnecting === 'twitter' ? 'Connecting...' : 'Continue with X (Twitter)'}
            </button>
          </div>

          {/* Terms */}
          <div className="text-center">
            <p className="text-white/50 text-xs">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
