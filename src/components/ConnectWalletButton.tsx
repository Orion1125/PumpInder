'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { WalletConnectionModal } from '@/components/WalletConnectionModal';

interface ConnectWalletButtonProps {
  balance: number;
}

export function ConnectWalletButton({ balance }: ConnectWalletButtonProps) {
  const { 
    wallet, 
    isConnected, 
    connectionState, 
    error, 
    isLoading,
    connectWallet
  } = useWallet();
  
  const [showModal, setShowModal] = useState(false);

  const handleConnectWallet = async () => {
    await connectWallet();
    if (isConnected) {
      setShowModal(false);
    }
  };

  const handleCreateWallet = () => {
    // This would typically open a wallet creation flow
    // For now, we'll simulate creating a wallet
    console.log('Create wallet flow would start here');
    setShowModal(false);
  };

  const handleRetryConnection = () => {
    handleConnectWallet();
  };

  const handleButtonClick = () => {
    if (isConnected) {
      // If connected, navigate to balance page or show wallet details
      window.location.href = '/balance';
    } else {
      setShowModal(true);
    }
  };

  // Connected state
  if (isConnected && wallet) {
    return (
      <>
        <div className="flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs uppercase tracking-[0.35em] text-white/70">
          <div className="flex items-center gap-2 text-base tracking-normal text-white">
            <span className="font-bold">{balance.toFixed(2)}</span>
            <span className="text-sm text-white/60">$PINDER</span>
          </div>
          <div className="hidden h-5 w-px bg-white/15 sm:block" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-[0.65rem] tracking-[0.4em] text-white/50">
              Wallet Connected
            </span>
          </div>
        </div>

        <WalletConnectionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          connectionState={connectionState}
          error={error}
          onConnectWallet={handleConnectWallet}
          onCreateWallet={handleCreateWallet}
          onRetryConnection={handleRetryConnection}
          isLoading={isLoading}
        />
      </>
    );
  }

  // Disconnected state - show Connect Wallet button
  return (
    <>
      <button 
        className="flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs uppercase tracking-[0.35em] text-white/70 hover:bg-white/10 transition-colors"
        onClick={handleButtonClick}
        disabled={isLoading}
      >
        <div className="flex items-center gap-2 text-base tracking-normal text-white">
          <span className="font-bold">{balance.toFixed(2)}</span>
          <span className="text-sm text-white/60">$PINDER</span>
        </div>
        <div className="hidden h-5 w-px bg-white/15 sm:block" />
        <span className="text-[0.65rem] tracking-[0.4em] text-white/50">
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </span>
      </button>

      <WalletConnectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        connectionState={connectionState}
        error={error}
        onConnectWallet={handleConnectWallet}
        onCreateWallet={handleCreateWallet}
        onRetryConnection={handleRetryConnection}
        isLoading={isLoading}
      />
    </>
  );
}
