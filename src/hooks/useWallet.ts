'use client';

import { useState, useEffect } from 'react';
import { Keypair } from '@solana/web3.js';
import { mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';

export interface WalletInfo {
  publicKey: string;
  secretPhrase: string;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load wallet from localStorage on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('pinder_wallet');
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet);
        // Set wallet in a separate effect to avoid synchronous state updates
        setTimeout(() => setWallet(walletData), 0);
      } catch (error) {
        console.error('Error loading wallet:', error);
        localStorage.removeItem('pinder_wallet');
      }
    }
    // Set loading state asynchronously to avoid synchronous state updates
    setTimeout(() => setIsLoading(false), 0);
  }, []);

  const createWallet = (mnemonic: string): WalletInfo => {
    const seed = mnemonicToSeedSync(mnemonic);
    const derivationPath = "m/44'/501'/0'/0'";
    const derivedKey = derivePath(derivationPath, seed.toString('hex')).key;
    const keypair = Keypair.fromSeed(derivedKey);
    
    return {
      publicKey: keypair.publicKey.toBase58(),
      secretPhrase: mnemonic
    };
  };

  const saveWallet = (walletData: WalletInfo) => {
    setWallet(walletData);
    localStorage.setItem('pinder_wallet', JSON.stringify(walletData));
  };

  const clearWallet = () => {
    setWallet(null);
    localStorage.removeItem('pinder_wallet');
  };

  const getKeypair = (): Keypair | null => {
    if (!wallet) return null;
    
    try {
      const seed = mnemonicToSeedSync(wallet.secretPhrase);
      const derivationPath = "m/44'/501'/0'/0'";
      const derivedKey = derivePath(derivationPath, seed.toString('hex')).key;
      return Keypair.fromSeed(derivedKey);
    } catch (error) {
      console.error('Error deriving keypair:', error);
      return null;
    }
  };

  return {
    wallet,
    isLoading,
    createWallet,
    saveWallet,
    clearWallet,
    getKeypair,
    hasWallet: !!wallet
  };
}
