'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, Filter, Plus, Search, TrendingUp, Flame, ArrowDown, X, ShoppingCart } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { useBalance } from '@/hooks/useBalance';
import { useWallet } from '@/hooks/useWallet';

type TransactionType = 'BOOST' | 'SIGNAL' | 'RECEIVE' | 'PASS';

type LedgerRow = {
  time: string;
  type: TransactionType;
  entity: string;
  amountDisplay: string;
  tone: 'profit' | 'loss' | 'neutral';
};

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
  const { totalBalanceUSD, isLoading } = useBalance();
  const { isConnected } = useWallet();
  const [displayedBalance, setDisplayedBalance] = useState(0);
  const [ledgerRows] = useState<LedgerRow[]>([]);

  // Handle connection state changes separately
  useEffect(() => {
    if (!isConnected) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setDisplayedBalance(0);
    }
  }, [isConnected]);

  // Handle balance animation when connected
  useEffect(() => {
    if (!isConnected) return;

    let frame = 0;
    const start = performance.now();
    const duration = 1500;
    const targetBalance = totalBalanceUSD;

    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayedBalance(targetBalance * progress);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [totalBalanceUSD, isConnected]);

  return (
    <div className="swipe-page balance-page">
      <AppHeader activePage="swipe" />

      <div className="content-width">

        <section className="card treasury-card" aria-labelledby="treasury-heading" data-animate="fade" style={{overflow: 'hidden'}}>
          <div className="card-head" style={{margin: '0 -1rem', padding: '0 1rem', position: 'relative'}}>
            <div style={{position: 'absolute', bottom: '0', left: '-1rem', right: '-1rem', height: '4px', backgroundColor: 'black'}}></div>
            <h2 id="treasury-heading" className="display-font text-center pt-0 pb-6" style={{fontSize: '1.5rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase'}}>BALANCE</h2>
          </div>

          <div className="hero-value">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <p className="balance-value">{formatCurrency(displayedBalance)}</p>
              <span className="balance-currency">$PINDER</span>
            </div>
            {!isConnected && (
              <p className="text-sm text-gray-500 mt-2">Connect your wallet to view your balance</p>
            )}
            {isLoading && (
              <p className="text-sm text-gray-500 mt-2">Loading balance...</p>
            )}
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

        </section>

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
                    <span className="table-cell" data-label="DATE">{row.time}</span>
                    <span className="table-cell" data-label="TYPE">
                      <span className="type-label" style={{ color: meta.textColor, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <meta.icon size={16} strokeWidth={2} />
                        {meta.label}
                      </span>
                    </span>
                    <span className="table-cell" data-label="ENTITY">{row.entity}</span>
                    <span className={`table-cell amount ${row.tone}`} data-label="AMOUNT">{row.amountDisplay}</span>
                  </div>
                );
              })}

              {ledgerRows.length === 0 && (
                <div className="table-row" role="row">
                  <span className="table-cell" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem 0', color: '#999' }}>
                    No transactions yet. Start swiping to generate activity.
                  </span>
                </div>
              )}
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
      </div>
    </div>
  );
}
