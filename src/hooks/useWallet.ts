'use client';

import { useState, useEffect } from 'react';
import { Keypair } from '@solana/web3.js';
import { mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';

export interface WalletInfo {
  publicKey: string;
  secretPhrase: string;
}

export type WalletConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'wallet-not-created' 
  | 'connection-failed' 
  | 'wallet-unavailable';

export interface WalletState {
  wallet: WalletInfo | null;
  isLoading: boolean;
  connectionState: WalletConnectionState;
  error: string | null;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionState, setConnectionState] = useState<WalletConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Load wallet from localStorage on mount
  useEffect(() => {
    const loadWallet = () => {
      try {
        const savedWallet = localStorage.getItem('pinder_wallet');
        if (savedWallet) {
          const walletData = JSON.parse(savedWallet);
          setWallet(walletData);
          setConnectionState('connected');
        } else {
          setConnectionState('wallet-not-created');
        }
      } catch (loadError) {
        console.error('Error loading wallet:', loadError);
        setError('Failed to load wallet data');
        setConnectionState('wallet-unavailable');
        localStorage.removeItem('pinder_wallet');
      } finally {
        setIsLoading(false);
      }
    };

    // Use setTimeout to avoid synchronous state updates
    setTimeout(loadWallet, 0);
  }, []);

  const connectWallet = async (): Promise<boolean> => {
    if (wallet) {
      setConnectionState('connected');
      return true;
    }

    setConnectionState('connecting');
    setError(null);

    try {
      const savedWallet = localStorage.getItem('pinder_wallet');
      if (!savedWallet) {
        setConnectionState('wallet-not-created');
        return false;
      }

      const walletData = JSON.parse(savedWallet);
      setWallet(walletData);
      setConnectionState('connected');
      return true;
    } catch (connectError) {
      console.error('Error connecting wallet:', connectError);
      setError('Failed to connect wallet');
      setConnectionState('connection-failed');
      return false;
    }
  };

  const disconnectWallet = () => {
    setConnectionState('disconnected');
    setError(null);
  };

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
    setConnectionState('connected');
    setError(null);
    localStorage.setItem('pinder_wallet', JSON.stringify(walletData));
  };

  const clearWallet = () => {
    setWallet(null);
    setConnectionState('wallet-not-created');
    setError(null);
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
      setError('Failed to derive keypair');
      return null;
    }
  };

  return {
    wallet,
    isLoading,
    connectionState,
    error,
    createWallet,
    saveWallet,
    clearWallet,
    connectWallet,
    disconnectWallet,
    getKeypair,
    hasWallet: !!wallet,
    isConnected: connectionState === 'connected'
  };
}
