'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, Filter, Plus, Search, TrendingUp, Flame, ArrowDown, X, ShoppingCart } from 'lucide-react';

import { AppHeader } from '@/components/AppHeader';
import { useWallet } from '@/hooks/useWallet';

const TREASURY_BALANCE = 14250;

type TransactionType = 'BOOST' | 'SIGNAL' | 'RECEIVE' | 'PASS';

const ledgerRows: Array<{
  time: string;
  type: TransactionType;
  entity: string;
  amountDisplay: string;
  tone: 'profit' | 'loss' | 'neutral';
}> = [
  { time: '14:02 PM', type: 'BOOST', entity: 'Profile Boost', amountDisplay: '- 500.00', tone: 'loss' },
  { time: '12:15 PM', type: 'SIGNAL', entity: '@Satoshi', amountDisplay: '- 100.00', tone: 'loss' },
  { time: '09:00 AM', type: 'RECEIVE', entity: '0x.....8a', amountDisplay: '+ 5,000.00', tone: 'profit' },
  { time: 'YESTERDAY', type: 'PASS', entity: 'Batch Action', amountDisplay: '- 0.00', tone: 'neutral' },
];

const transactionMeta: Record<TransactionType, { label: string; textColor: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }> = {
  BOOST: { label: 'BOOST', textColor: '#FF4D00', icon: TrendingUp },
  SIGNAL: { label: 'SIGNAL', textColor: '#FF4D00', icon: Flame },
  RECEIVE: { label: 'DEPOSIT', textColor: '#121212', icon: ArrowDown },
  PASS: { label: 'PASS', textColor: '#FF4D00', icon: X },
};

const actionButtons = [
  { label: 'DEPOSIT', icon: Plus, bg: '#00D668', textColor: '#121212', iconColor: '#121212', variant: 'deposit' },
  { label: 'WITHDRAW', icon: ArrowUp, bg: '#5D5FEF', textColor: '#FFFFFF', iconColor: '#FFFFFF', variant: 'withdraw' },
  { label: 'BUY', icon: ShoppingCart, bg: '#FFD700', textColor: '#121212', iconColor: '#121212', variant: 'buy' },
];


const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function BalancePage() {
  const [displayedBalance, setDisplayedBalance] = useState(0);
  const router = useRouter();
  const { hasWallet, isLoading } = useWallet();
  const isWalletConnected = hasWallet && !isLoading;
  const safeBalanceDisplay = formatCurrency(Math.min(displayedBalance, TREASURY_BALANCE));

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = 1500;

    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayedBalance(TREASURY_BALANCE * progress);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, []);

  const handleCreateWallet = () => {
    router.push('/onboarding');
  };

  const handleRestoreWallet = () => {
    router.push('/settings/security');
  };

  return (
    <div className="swipe-page balance-page">
      <AppHeader
        activePage="swipe"
        balanceDisplay={safeBalanceDisplay}
        showBalance={isWalletConnected}
      />

      <main className="swipe-grid">
        <section className="card treasury-card" aria-labelledby="treasury-heading" data-animate="fade">
          <div className="card-head">
            <h2 id="treasury-heading" className="display-font">BALANCE</h2>
          </div>

          {isLoading ? (
            <div className="wallet-connect-panel wallet-connect-panel--loading" aria-live="polite">
              <div className="wallet-loading-bar" aria-hidden="true" />
              <p className="ui-font text-sm text-ink-secondary">Checking wallet status…</p>
            </div>
          ) : isWalletConnected ? (
            <>
              <div className="hero-value">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <p className="balance-value">{safeBalanceDisplay}</p>
                  <span className="ui-font">$PINDER</span>
                </div>
                <span className="trend-text">+ 12% vs last week</span>
              </div>

              <div className="action-row">
                {actionButtons.map((button) => (
                  <button
                    key={button.label}
                    type="button"
                    className="action-button"
                    style={{ backgroundColor: button.bg, color: button.textColor }}
                  >
                    <button.icon size={18} strokeWidth={2} color={button.iconColor} aria-hidden="true" />
                    <span>{button.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="wallet-connect-panel" aria-live="polite">
              <div className="wallet-connect-eyebrow">TREASURY LOCKED</div>
              <div className="wallet-connect-shell">
                <div className="wallet-connect-copy">
                  <h3 className="wallet-connect-headline">Connect your PumpInder wallet</h3>
                  <p className="wallet-connect-desc">
                    Plug in to unlock balances, boosts, and withdraw actions. Wallets stay local — nothing leaves this device.
                  </p>
                  <ul className="wallet-benefits" aria-label="Wallet benefits">
                    <li>See real-time $PINDER balances</li>
                    <li>Deploy boosts + withdraw without re-auth</li>
                    <li>Encrypted recovery lives in Settings → Security</li>
                  </ul>

                  <div className="wallet-connect-actions">
                    <button type="button" className="wallet-connect-button wallet-connect-button--primary" onClick={handleCreateWallet}>
                      Create PumpInder wallet
                    </button>
                    <button type="button" className="wallet-connect-button wallet-connect-button--secondary" onClick={handleRestoreWallet}>
                      I have a recovery phrase
                    </button>
                  </div>
                  <p className="wallet-connect-subtext">
                    • Seed phrase never leaves your browser • Auto-locks after inactivity
                  </p>
                </div>

                <div className="wallet-connect-aside" aria-hidden="true">
                  <div className="wallet-metric-card">
                    <span className="wallet-metric-label">Projected Balance</span>
                    <p className="wallet-metric-value">{safeBalanceDisplay}</p>
                    <span className="wallet-metric-ticker">+ 12% vs last week</span>
                  </div>
                  <div className="wallet-security-card">
                    <p className="wallet-security-title">Local custody</p>
                    <p className="wallet-security-copy">
                      Generated with JetBrains crypto primitives, stored with industrial neo-brutalist paranoia.
                    </p>
                    <div className="wallet-security-tags">
                      <span>Zero cloud</span>
                      <span>Recovery vault</span>
                      <span>SOL-ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </section>

        {isWalletConnected && (
          <section className="card ledger-card" aria-labelledby="ledger-heading" data-animate="slide">
            <div className="ledger-head">
              <h2 id="ledger-heading">TRANSACTION HISTORY</h2>
              <div className="ledger-tools">
                <label className="search-control">
                  <Search size={16} strokeWidth={2} color="#121212" aria-hidden="true" />
                  <input type="search" placeholder="SEARCH..." aria-label="Search transactions" />
                </label>
                <button type="button" className="filter-button">
                  <Filter size={16} strokeWidth={2} color="#121212" aria-hidden="true" />
                  <span>FILTER</span>
                </button>
              </div>
            </div>

            <div className="ledger-table" role="table" aria-label="Transaction ledger">
              <div className="table-row table-header" role="row">
                <span className="table-cell" role="columnheader">DATE</span>
                <span className="table-cell" role="columnheader">TYPE</span>
                <span className="table-cell" role="columnheader">ENTITY</span>
                <span className="table-cell amount" role="columnheader">
                  AMOUNT
                </span>
              </div>

              {ledgerRows.map((row, index) => {
                const meta = transactionMeta[row.type];
                return (
                  <div
                    className="table-row"
                    role="row"
                    key={`${row.time}-${row.entity}`}
                    data-row-index
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    <span className="table-cell">{row.time}</span>
                    <span className="table-cell">
                      <span className="type-label" style={{ color: meta.textColor, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <meta.icon size={16} strokeWidth={2} />
                        {meta.label}
                      </span>
                    </span>
                    <span className="table-cell">{row.entity}</span>
                    <span className={`table-cell amount ${row.tone}`}>{row.amountDisplay}</span>
                  </div>
                );
              })}
            </div>

            <nav className="pagination" aria-label="Ledger pagination">
              <button type="button" className="pagination-button" aria-label="Previous page">
                &lt;
              </button>
              <button type="button" className="page-number active" aria-current="page">
                1
              </button>
              <button type="button" className="page-number">2</button>
              <button type="button" className="page-number">3</button>
              <button type="button" className="pagination-button" aria-label="Next page">
                &gt;
              </button>
            </nav>
          </section>
        )}
      </main>
    </div>
  );
}
