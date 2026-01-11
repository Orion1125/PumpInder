'use client';

interface ConnectWalletButtonProps {
  balance: number;
}

export function ConnectWalletButton({ balance }: ConnectWalletButtonProps) {
  return (
    <div className="flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs uppercase tracking-[0.35em] text-white/70">
      <div className="flex items-center gap-2 text-base tracking-normal text-white">
        <span className="font-bold">{balance.toFixed(2)}</span>
        <span className="text-sm text-white/60">$PINDER</span>
      </div>
      <div className="hidden h-5 w-px bg-white/15 sm:block" />
      <span className="text-[0.65rem] tracking-[0.4em] text-white/50">
        Mock Wallet
      </span>
    </div>
  );
}
