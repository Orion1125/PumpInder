'use client';

import { useCallback, useState } from 'react';
import { useWallet as useAdapterWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export type WalletConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'connection-failed';

const PHANTOM_WALLET_NAME = 'Phantom';

export function useWallet() {
  const { publicKey, connected, connecting, disconnect, wallet, select, connect, signMessage } = useAdapterWallet();
  const { setVisible } = useWalletModal();
  const [error, setError] = useState<string | null>(null);

  const connectionState: WalletConnectionState = connected
    ? 'connected'
    : connecting
      ? 'connecting'
      : 'disconnected';

  const connectWallet = useCallback(async () => {
    setError(null);

    try {
      if (!wallet || wallet.adapter.name !== PHANTOM_WALLET_NAME) {
        setVisible(true);
        select(PHANTOM_WALLET_NAME as never);
        return;
      }

      await connect();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to connect Phantom wallet';
      setError(message);
      setVisible(true);
    }
  }, [wallet, select, connect, setVisible]);

  const disconnectWallet = () => {
    setError(null);
    disconnect();
  };

  const signWalletMessage = useCallback(async (message: string) => {
    if (!signMessage) {
      throw new Error('Wallet does not support message signing');
    }

    const encoded = new TextEncoder().encode(message);
    const signature = await signMessage(encoded);
    return Array.from(signature);
  }, [signMessage]);

  return {
    wallet: publicKey
      ? { publicKey: publicKey.toBase58() }
      : null,
    isLoading: connecting,
    connectionState,
    error,
    connectWallet,
    disconnectWallet,
    hasWallet: connected && !!publicKey,
    isConnected: connected && !!publicKey,
    publicKey: publicKey?.toBase58() ?? null,
    walletName: wallet?.adapter.name ?? null,
    canSignMessage: !!signMessage,
    signWalletMessage,
  };
}
