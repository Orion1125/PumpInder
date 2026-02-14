'use client';

import { ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as BaseWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

const getNetwork = (): WalletAdapterNetwork => {
  const envNetwork = process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork | undefined;
  return envNetwork ?? WalletAdapterNetwork.Mainnet;
};

const getEndpoint = (network: WalletAdapterNetwork) => {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network);
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const network = getNetwork();
  const endpoint = getEndpoint(network);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network],
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'processed' }}>
      <BaseWalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </BaseWalletProvider>
    </ConnectionProvider>
  );
}
