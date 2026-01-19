'use client';

import { CreateWallet } from '@/components/CreateWallet';
import { ProfileWorkspace } from '@/components/ProfileWorkspace';
import { useWallet } from '@/hooks/useWallet';
import { useState } from 'react';

export default function OnboardingPage() {
  const { hasWallet, saveWallet } = useWallet();
  const [showWalletCreation, setShowWalletCreation] = useState(false);
  const [walletCreated, setWalletCreated] = useState(false);

  const handleWalletCreated = (wallet: { publicKey: string; secretPhrase: string }) => {
    saveWallet(wallet);
    setWalletCreated(true);
    setShowWalletCreation(false);
  };

  const handleSkipWallet = () => {
    setShowWalletCreation(false);
    setWalletCreated(true);
  };

  if (showWalletCreation) {
    return (
      <div className="min-h-screen bg-pinder-dark flex items-center justify-center p-4">
        <CreateWallet
          onWalletCreated={handleWalletCreated}
          onSkip={handleSkipWallet}
        />
      </div>
    );
  }

  return (
    <ProfileWorkspace
      eyebrow={walletCreated ? "Step 2 · mint your vibe" : "Step 1 · create your wallet"}
      title={walletCreated ? "Ship your PumpInder profile" : "Welcome to PumpInder"}
      subtitle={walletCreated ? "(Stashed on your local storage for now.)" : "Let's set up your wallet to get started"}
      submitLabel={walletCreated ? "Save & enter swipe mode" : "Create Wallet"}
      footnote={walletCreated ? "Finished here? We'll fast-track you to swipe mode and remember this device for next time." : "You'll be able to receive and send tokens with your own wallet"}
      successRedirect="/swipe"
      backHref="/"
      backLabel="Back to landing"
      onSubmit={() => {
        if (!walletCreated && !hasWallet) {
          setShowWalletCreation(true);
          return false; // Prevent form submission
        }
        return true; // Allow normal form submission
      }}
    />
  );
}
