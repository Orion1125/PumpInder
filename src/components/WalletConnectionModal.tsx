'use client';

import { X, AlertCircle, Wallet } from 'lucide-react';
import { WalletConnectionState } from '@/hooks/useWallet';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionState: WalletConnectionState;
  error: string | null;
  onConnectWallet: () => Promise<void>;
  onCreateWallet: () => void;
  onRetryConnection: () => void;
  isLoading?: boolean;
}

const stateContent = {
  'disconnected': {
    title: 'Connect Your Wallet',
    description: 'Connect your PumpInder wallet to enable likes, superlikes, tipping, and other in-app actions.',
    actionText: 'Connect Wallet',
    showAction: true,
    showSecondary: false,
    secondaryText: '',
    icon: Wallet
  },
  'wallet-not-created': {
    title: 'No Wallet Found',
    description: 'Create your PumpInder wallet to start interacting, tipping, and unlocking in-app features.',
    actionText: 'Create Wallet',
    showAction: true,
    showSecondary: false,
    secondaryText: '',
    icon: Wallet
  },
  'connecting': {
    title: 'Connecting Wallet...',
    description: 'Please wait while we connect your wallet.',
    actionText: '',
    showAction: false,
    showSecondary: false,
    secondaryText: '',
    icon: Wallet
  },
  'connection-failed': {
    title: "Couldn't Connect Your Wallet",
    description: 'Please try again. Your wallet and assets are safe.',
    actionText: 'Retry Connection',
    showAction: true,
    showSecondary: true,
    secondaryText: 'Cancel',
    icon: AlertCircle
  },
  'wallet-unavailable': {
    title: 'Wallet Temporarily Unavailable',
    description: "We're having trouble loading your wallet. Please check your connection or try again later.",
    actionText: 'Retry',
    showAction: true,
    showSecondary: false,
    secondaryText: '',
    icon: AlertCircle
  },
  'connected': {
    title: 'Wallet Connected',
    description: 'Your wallet is now connected and ready to use.',
    actionText: '',
    showAction: false,
    showSecondary: false,
    secondaryText: '',
    icon: Wallet
  }
};

export function WalletConnectionModal({
  isOpen,
  onClose,
  connectionState,
  error,
  onConnectWallet,
  onCreateWallet,
  onRetryConnection,
  isLoading = false
}: WalletConnectionModalProps) {
  if (!isOpen) return null;

  const content = stateContent[connectionState];
  const Icon = content.icon;

  const handlePrimaryAction = () => {
    switch (connectionState) {
      case 'disconnected':
        onConnectWallet();
        break;
      case 'wallet-not-created':
        onCreateWallet();
        break;
      case 'connection-failed':
      case 'wallet-unavailable':
        onRetryConnection();
        break;
      default:
        break;
    }
  };

  const handleSecondaryAction = () => {
    if (connectionState === 'connection-failed') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 max-w-md w-full bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {content.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={connectionState === 'connecting' || isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`p-4 rounded-full ${
              connectionState === 'connection-failed' || connectionState === 'wallet-unavailable'
                ? 'bg-red-100 text-red-600'
                : connectionState === 'connecting'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <Icon size={32} />
            </div>

            <p className="text-gray-600 leading-relaxed">
              {content.description}
            </p>

            {error && (
              <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {connectionState === 'connecting' && (
              <div className="w-full flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          {content.showAction && (
            <button
              onClick={handlePrimaryAction}
              disabled={isLoading || connectionState === 'connecting'}
              className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || connectionState === 'connecting' ? 'Please wait...' : content.actionText}
            </button>
          )}

          {content.showSecondary && (
            <button
              onClick={handleSecondaryAction}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {content.secondaryText}
            </button>
          )}

          {connectionState === 'connected' && (
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Continue
            </button>
          )}
        </div>

        {/* Trust Message */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 text-center">
            Your wallet is user-owned and your assets are never at risk during connection attempts.
          </p>
        </div>
      </div>
    </div>
  );
}
