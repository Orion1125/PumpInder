'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { useWallet } from '@/hooks/useWallet';

export default function SecuritySettingsPage() {
  const { publicKey, isConnected, signWalletMessage, canSignMessage } = useWallet();
  const [proxyPublicKey, setProxyPublicKey] = useState<string | null>(null);
  const [proxyPrivateKey, setProxyPrivateKey] = useState<string | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    if (!isConnected || !publicKey) {
      setProxyPublicKey(null);
      return;
    }

    const fetchProxyWallet = async () => {
      try {
        const res = await fetch(`/api/proxy-wallet?wallet=${publicKey}`);
        const data = await res.json();
        if (res.ok) {
          setProxyPublicKey(data.proxyPublicKey ?? null);
        }
      } catch (error) {
        console.error('Failed to load proxy wallet', error);
      }
    };

    fetchProxyWallet();
  }, [isConnected, publicKey]);

  const revealPrivateKey = async () => {
    if (!publicKey || !isConnected) {
      setRevealError('Connect your wallet first.');
      return;
    }

    if (!canSignMessage) {
      setRevealError('Your wallet does not support message signing.');
      return;
    }

    setIsRevealing(true);
    setRevealError(null);

    try {
      const challengeRes = await fetch('/api/proxy-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletPublicKey: publicKey }),
      });

      const challengeData = await challengeRes.json();
      if (!challengeRes.ok || !challengeData.message) {
        throw new Error(challengeData?.error || 'Failed to create ownership challenge');
      }

      const signature = await signWalletMessage(challengeData.message);

      const revealRes = await fetch('/api/proxy-wallet/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletPublicKey: publicKey,
          message: challengeData.message,
          signature,
        }),
      });

      const revealData = await revealRes.json();
      if (!revealRes.ok) {
        throw new Error(revealData?.error || 'Failed to reveal proxy key');
      }

      setProxyPublicKey(revealData.proxyPublicKey ?? null);
      setProxyPrivateKey(revealData.proxyPrivateKey ?? null);
    } catch (error) {
      setRevealError(error instanceof Error ? error.message : 'Failed to reveal proxy private key');
    } finally {
      setIsRevealing(false);
    }
  };

  return (
    <div className="min-h-screen text-(--ink-primary)">
      <AppHeader logoType="back" showBalance={false} showProfile={false} showNav={false} />
      
      <div className="settings-shell">
        <main className="max-w-3xl mx-auto">
          <div className="onboarding-card" style={{ width: '100%', maxWidth: '100%' }}>
            <div className="space-y-3">
              <p className="ui-font text-sm text-ink-secondary">{/* WALLET SECURITY */}</p>
              <h1 className="display-font text-4xl tracking-[0.3em]">ACCOUNT SECURITY</h1>
              <p className="ui-font text-sm text-ink-secondary">
                Your account is secured by your Phantom wallet. Keep your wallet safe to protect your PumpInder account.
              </p>
            </div>

            <div className="mt-8 space-y-6">
              <div className="wallet-backup-panel">
                <div className="space-y-2">
                  <p className="ui-font text-xs text-ink-secondary uppercase tracking-widest">Connected Wallet</p>
                  {isConnected && publicKey ? (
                    <p className="ui-font text-sm font-mono break-all">{publicKey}</p>
                  ) : (
                    <p className="ui-font text-sm text-ink-secondary">No wallet connected</p>
                  )}
                </div>
              </div>

              <div className="wallet-backup-panel">
                <div className="space-y-3">
                  <p className="ui-font text-xs text-ink-secondary uppercase tracking-widest">Proxy Wallet (For Likes, Superlikes, Tips)</p>
                  {proxyPublicKey ? (
                    <p className="ui-font text-sm font-mono break-all">Public: {proxyPublicKey}</p>
                  ) : (
                    <p className="ui-font text-sm text-ink-secondary">Proxy wallet will be created automatically for your account.</p>
                  )}

                  {proxyPrivateKey ? (
                    <div className="space-y-2">
                      <p className="ui-font text-xs text-ink-secondary uppercase tracking-widest">Private Key (Base58)</p>
                      <p className="ui-font text-sm font-mono break-all">{proxyPrivateKey}</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-block"
                      onClick={revealPrivateKey}
                      disabled={isRevealing || !isConnected}
                    >
                      {isRevealing ? 'VERIFYING OWNERSHIP…' : 'REVEAL PRIVATE KEY'}
                    </button>
                  )}

                  {revealError && <p className="ui-font text-xs text-red-700">{revealError}</p>}
                </div>
              </div>

              <div className="wallet-backup-panel">
                <div className="space-y-3">
                  <p className="ui-font text-xs text-ink-secondary uppercase tracking-widest">Security Tips</p>
                  <ul className="space-y-2 ui-font text-sm">
                    <li>• Never share your Phantom wallet seed phrase with anyone</li>
                    <li>• Back up your seed phrase in a secure, offline location</li>
                    <li>• Use a hardware wallet for additional security</li>
                    <li>• Always verify transactions before signing</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link href="/settings" className="btn-block" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                Back to Settings
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
