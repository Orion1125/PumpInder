'use client';

import { useMemo, useState } from 'react';
import { ArrowDownToLine, Copy, ExternalLink, QrCode, Wallet } from 'lucide-react';
import { useProxyWallet } from '@/hooks/useProxyWallet';
import { useWallet } from '@/hooks/useWallet';
import { TOKEN_MINTS } from '@/constants/tokens';

const PUMPSWAP_URL = TOKEN_MINTS.PINDER
  ? `https://pump.fun/coin/${TOKEN_MINTS.PINDER}`
  : 'https://pump.fun'; // fallback until CA is live

const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-6)}`;

export function ProxyWalletButton() {
  const { proxyPublicKey, proxyBalanceSol, refresh } = useProxyWallet();
  const { isConnected, publicKey, signWalletMessage, canSignMessage } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState<{ success: boolean; message: string } | null>(null);

  const qrValue = useMemo(() => {
    if (!proxyPublicKey) return '';
    return `solana:${proxyPublicKey}`;
  }, [proxyPublicKey]);

  const handleCopy = async () => {
    if (!proxyPublicKey) return;
    try {
      await navigator.clipboard.writeText(proxyPublicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const handleWithdraw = async () => {
    if (!publicKey || !canSignMessage || withdrawing) return;
    setWithdrawing(true);
    setWithdrawResult(null);

    try {
      // 1. Get challenge message from server
      const challengeRes = await fetch('/api/proxy-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletPublicKey: publicKey }),
      });
      const challengeData = await challengeRes.json();
      if (!challengeRes.ok || !challengeData?.message) {
        throw new Error(challengeData?.error || 'Failed to get challenge');
      }

      // 2. Sign the message with the connected wallet
      const signatureArray = await signWalletMessage(challengeData.message);
      if (!signatureArray) throw new Error('Signing cancelled');

      // 3. Call withdraw endpoint
      const withdrawRes = await fetch('/api/proxy-wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletPublicKey: publicKey,
          message: challengeData.message,
          signature: Array.from(signatureArray),
        }),
      });
      const withdrawData = await withdrawRes.json();
      if (!withdrawRes.ok) {
        throw new Error(withdrawData?.error || 'Withdraw failed');
      }

      setWithdrawResult({
        success: true,
        message: `Withdrew ${withdrawData.amountSol.toFixed(6)} SOL to your wallet`,
      });
      // Refresh proxy balance
      void refresh();
    } catch (err) {
      setWithdrawResult({
        success: false,
        message: err instanceof Error ? err.message : 'Withdraw failed',
      });
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn-block flex items-center gap-2 px-3 py-2 text-[0.62rem] tracking-[0.28em]"
        onClick={() => setIsOpen(true)}
        aria-label="Proxy wallet funding details"
      >
        <Wallet size={14} />
        {proxyBalanceSol.toFixed(3)} SOL
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[18vh] bg-black/45 animate-overlay-in">
          <div className="w-[95%] sm:w-[92%] max-w-sm border-3 sm:border-4 border-black bg-white p-4 sm:p-5 shadow-[6px_6px_0_#121212] sm:shadow-[8px_8px_0_#121212] animate-modal-pop max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="display-font text-lg sm:text-xl tracking-[0.15em] sm:tracking-[0.2em]">PROXY FUNDING</h3>
              <button
                type="button"
                className="ui-font text-xs border-2 border-black px-3 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setIsOpen(false)}
              >
                CLOSE
              </button>
            </div>

            {!isConnected ? (
              <p className="ui-font mt-4 text-sm text-ink-secondary">Connect wallet to load proxy details.</p>
            ) : !proxyPublicKey ? (
              <p className="ui-font mt-4 text-sm text-ink-secondary">Loading proxy wallet details…</p>
            ) : (
              <>
                <p className="ui-font mt-4 text-xs text-ink-secondary uppercase tracking-wider">Proxy Balance</p>
                <p className="display-font text-2xl tracking-[0.1em]">{proxyBalanceSol.toFixed(6)} SOL</p>

                <p className="ui-font mt-4 text-xs text-ink-secondary uppercase tracking-wider">Funding Address</p>
                <div className="mt-2 border-2 border-black p-2 bg-[#F4F4F0]">
                  <p className="ui-font text-xs font-mono break-all">{proxyPublicKey}</p>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="btn-block flex items-center justify-center gap-2 px-3 py-2 text-[0.58rem] tracking-[0.24em]"
                    onClick={handleCopy}
                  >
                    <Copy size={13} />
                    {copied ? 'COPIED' : `COPY ${shortenAddress(proxyPublicKey)}`}
                  </button>
                </div>

                <div className="mt-5 flex justify-center">
                  <div className="border-2 border-black p-2 bg-white">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrValue)}`}
                      alt="Proxy wallet funding QR code"
                      width={180}
                      height={180}
                    />
                  </div>
                </div>

                <p className="ui-font mt-3 text-center text-[0.68rem] text-ink-secondary">
                  Send SOL here to fund likes, superlikes, and tips.
                </p>

                {/* Buy $PINDER + Withdraw row — always visible */}
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <a
                    href={PUMPSWAP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="proxy-modal-btn flex items-center justify-center gap-1.5 text-center"
                  >
                    <ExternalLink size={12} />
                    BUY $PINDER
                  </a>
                  {canSignMessage && (
                    <button
                      type="button"
                      disabled={withdrawing || proxyBalanceSol <= 0}
                      className="proxy-modal-btn flex items-center justify-center gap-1.5 disabled:opacity-40"
                      onClick={handleWithdraw}
                    >
                      <ArrowDownToLine size={12} />
                      {withdrawing ? 'WITHDRAWING…' : 'WITHDRAW ALL'}
                    </button>
                  )}
                </div>

                {withdrawResult && (
                  <p
                    className={`ui-font mt-2 text-center text-[0.68rem] ${
                      withdrawResult.success ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {withdrawResult.message}
                  </p>
                )}

              </>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-[0.62rem] ui-font text-ink-secondary uppercase tracking-[0.22em]">
              <QrCode size={12} />
              SCAN TO FUND
            </div>
          </div>
        </div>
      )}
    </>
  );
}
