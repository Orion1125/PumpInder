'use client';

import { useWallet } from '@/hooks/useWallet';
import { useBalance } from '@/hooks/useBalance';

interface ConnectWalletButtonProps {
  balance?: number;
  onContinueSwiping?: () => void;
}

export function ConnectWalletButton({ balance: propBalance, onContinueSwiping }: ConnectWalletButtonProps) {
  const { isConnected, isLoading, connectWallet } = useWallet();
  const { pinderBalance, isLoading: isBalanceLoading } = useBalance();

  const displayBalance = isConnected ? pinderBalance : (propBalance && propBalance > 0 ? propBalance : 0);

  const handleButtonClick = () => {
    if (!isConnected) {
      void connectWallet();
      return;
    }
    onContinueSwiping?.();
  };

  return (
    <button
      type="button"
      className="btn-block flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 py-2.5 text-xs uppercase tracking-[0.2em] sm:tracking-[0.35em] min-h-[44px]"
      onClick={handleButtonClick}
      disabled={isLoading || (isConnected && isBalanceLoading)}
      aria-label={isConnected ? 'Wallet connected' : 'Connect Phantom wallet'}
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
            <span className="text-[0.7rem] sm:text-[0.65rem] tracking-[0.25em] sm:tracking-[0.4em] opacity-80">
              Connected
            </span>
          </>
        ) : (
          <span className="text-[0.7rem] sm:text-[0.65rem] tracking-[0.25em] sm:tracking-[0.4em] text-white">
            {isLoading ? 'Loading…' : 'Connect Wallet'}
          </span>
        )}
      </div>
    </button>
  );
}
