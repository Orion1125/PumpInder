'use client';

import { useState } from 'react';
import { X, Twitter, Mail, Check, AlertCircle } from 'lucide-react';
import type { SocialAccount } from '@/types/social';

interface AuthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkedAccounts: SocialAccount[];
  onConnectTwitter: () => void;
  onConnectGmail: () => void;
  onSelectAccount: (account: SocialAccount) => void;
}

export function AuthenticationModal({
  isOpen,
  onClose,
  linkedAccounts,
  onConnectTwitter,
  onConnectGmail,
  onSelectAccount,
}: AuthenticationModalProps) {
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState<'twitter' | 'gmail' | null>(null);

  const hasLinkedAccounts = linkedAccounts.length > 0;

  const handleConnectTwitter = async () => {
    setIsConnecting('twitter');
    try {
      await onConnectTwitter();
    } finally {
      setIsConnecting(null);
    }
  };

  const handleConnectGmail = async () => {
    setIsConnecting('gmail');
    try {
      await onConnectGmail();
    } finally {
      setIsConnecting(null);
    }
  };

  const handleSelectAccount = (account: SocialAccount) => {
    setSelectedAccount(account);
  };

  const handleConfirmSelection = () => {
    if (selectedAccount) {
      onSelectAccount(selectedAccount);
      onClose();
    }
  };

  const getAccountIcon = (type: 'twitter' | 'gmail') => {
    return type === 'twitter' ? (
      <Twitter className="w-5 h-5" />
    ) : (
      <Mail className="w-5 h-5" />
    );
  };

  const getAccountColor = (type: 'twitter' | 'gmail') => {
    return type === 'twitter' ? 'bg-blue-500' : 'bg-red-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Connect Account to Continue
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!hasLinkedAccounts ? (
          <div className="space-y-6">
            {/* No accounts message */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-white text-sm">
                    You haven&apos;t linked a Twitter or Gmail account yet. Please connect one to continue swiping.
                  </p>
                </div>
              </div>
            </div>

            {/* Connect options */}
            <div className="space-y-3">
              <button
                onClick={handleConnectTwitter}
                disabled={isConnecting !== null}
                className="w-full flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 transition-colors"
              >
                <Twitter className="w-5 h-5" />
                {isConnecting === 'twitter' ? 'Connecting...' : 'Connect Twitter'}
              </button>

              <button
                onClick={handleConnectGmail}
                disabled={isConnecting !== null}
                className="w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 transition-colors"
              >
                <Mail className="w-5 h-5" />
                {isConnecting === 'gmail' ? 'Connecting...' : 'Connect Gmail'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Instructions */}
            <p className="text-white/70 text-sm">
              Select one of your linked accounts to continue swiping:
            </p>

            {/* Linked accounts */}
            <div className="space-y-3">
              {linkedAccounts.map((account) => (
                <button
                  key={`${account.provider}-${account.handle}`}
                  onClick={() => handleSelectAccount(account)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    selectedAccount?.provider === account.provider && selectedAccount?.handle === account.handle
                      ? 'bg-white/10 border-white/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getAccountColor(account.provider)}/20`}>
                      <div className={getAccountColor(account.provider)}>
                        {getAccountIcon(account.provider)}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium capitalize">{account.provider}</p>
                      <p className="text-white/60 text-sm">{account.handle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.verified && (
                      <div className="bg-green-500/20 p-1 rounded-full">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                    )}
                    <div
                      className={`w-4 h-4 rounded-full border-2 transition-colors ${
                        selectedAccount?.provider === account.provider && selectedAccount?.handle === account.handle
                          ? 'bg-white border-white'
                          : 'border-white/30'
                      }`}
                    >
                      {selectedAccount?.provider === account.provider && selectedAccount?.handle === account.handle && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-gray-900" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedAccount}
                className="flex-1 px-4 py-3 bg-white hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed text-gray-900 rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
