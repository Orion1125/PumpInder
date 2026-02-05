'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useBalance } from '@/hooks/useBalance';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { WalletConnectionModal } from '@/components/WalletConnectionModal';
import { AuthenticationModal } from '@/components/AuthenticationModal';
import type { SocialAccount } from '@/types/social';

interface ConnectWalletButtonProps {
  balance?: number; // Optional, will be overridden by real balance
  onContinueSwiping?: () => void; // Callback for when authentication is complete
}

export function ConnectWalletButton({ balance: propBalance, onContinueSwiping }: ConnectWalletButtonProps) {
  const { 
    isConnected, 
    connectionState, 
    error, 
    isLoading,
    connectWallet
  } = useWallet();
  
  const { pinderBalance, isLoading: isBalanceLoading } = useBalance();
  const { 
    linkedAccounts, 
    connectTwitter, 
    connectGmail,
    fetchLinkedAccounts,
  } = useSocialAuth();
  
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Use real balance if wallet is connected, otherwise use prop balance
  const displayBalance = isConnected ? pinderBalance : (propBalance && propBalance > 0 ? propBalance : 0);

  const handleConnectWallet = async () => {
    await connectWallet();
    await fetchLinkedAccounts();
    setShowWalletModal(false);
    setShowAuthModal(true);
  };

  const handleCreateWallet = () => {
    // This would typically open a wallet creation flow
    // For now, we'll simulate creating a wallet
    console.log('Create wallet flow would start here');
    setShowWalletModal(false);
  };

  const handleRetryConnection = () => {
    handleConnectWallet();
  };

  const handleConnectTwitter = async () => {
    try {
      await connectTwitter();
    } catch (error) {
      console.error('Failed to connect Twitter:', error);
    }
  };

  const handleConnectGmail = async () => {
    try {
      await connectGmail();
    } catch (error) {
      console.error('Failed to connect Gmail:', error);
    }
  };

  const handleSelectAccount = (account: SocialAccount) => {
    // Account selected, allow continuing
    console.log('Selected account:', account);
    setShowAuthModal(false);
    onContinueSwiping?.();
  };

  const handleButtonClick = () => {
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }

    setShowAuthModal(true);
  };
  return (
    <>
      <button 
        type="button"
        className="btn-block flex items-center justify-between gap-4 px-5 py-2.5 text-xs uppercase tracking-[0.35em]"
        onClick={handleButtonClick}
        disabled={isLoading || isBalanceLoading}
        aria-label={isConnected ? 'Confirm social account to continue swiping' : 'Connect wallet to continue swiping'}
      >
        {displayBalance > 0 && (
          <div className="flex items-center gap-2 text-base tracking-normal">
            <span className="font-bold">{displayBalance.toFixed(2)}</span>
            <span className="text-sm opacity-80">$PINDER</span>
          </div>
        )}
        {displayBalance > 0 && <div className="hidden h-5 w-px bg-white/15 sm:block" />}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-[0.65rem] tracking-[0.4em] opacity-80">
                Continue Swiping
              </span>
            </>
          ) : (
            <span className="text-[0.65rem] tracking-[0.4em] text-white">
              {isLoading || isBalanceLoading ? 'Loading…' : 'Connect Wallet'}
            </span>
          )}
        </div>
      </button>

      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        connectionState={connectionState}
        error={error}
        onConnectWallet={handleConnectWallet}
        onCreateWallet={handleCreateWallet}
        onRetryConnection={handleRetryConnection}
        isLoading={isLoading}
      />

      <AuthenticationModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
