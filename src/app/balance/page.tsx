'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Flame,
  Plus,
  RefreshCcw,
  Rocket,
  Search,
  X,
  ArrowUp,
} from 'lucide-react';

const TREASURY_BALANCE = 14250;
const BURN_RATE = 65;

type TransactionType = 'BOOST' | 'SIGNAL' | 'RECEIVE' | 'PASS';

const ledgerRows: Array<{ time: string; type: TransactionType; entity: string; amount: number }> = [
  { time: '14:02 PM', type: 'BOOST', entity: 'Profile Boost', amount: -500 },
  { time: '12:15 PM', type: 'SIGNAL', entity: '@Satoshi', amount: -100 },
  { time: '09:00 AM', type: 'RECEIVE', entity: '0x...8a', amount: 5000 },
  { time: 'YESTERDAY', type: 'PASS', entity: 'Batch Action', amount: 0 },
];

const badgeMap: Record<
  TransactionType,
  { icon: typeof Rocket; bg: string; textColor: string; iconColor: string }
> = {
  BOOST: { icon: Rocket, bg: '#2F2CE3', textColor: '#FFFFFF', iconColor: '#FFFFFF' },
  SIGNAL: { icon: Flame, bg: '#FF4D00', textColor: '#FFFFFF', iconColor: '#FFFFFF' },
  RECEIVE: { icon: ArrowDown, bg: '#00D668', textColor: '#FFFFFF', iconColor: '#121212' },
  PASS: { icon: X, bg: '#E5E5E5', textColor: '#121212', iconColor: '#121212' },
};

const actionButtons = [
  { label: '[+] DEPOSIT', icon: Plus, bg: '#00D668', textColor: '#FFFFFF', iconColor: '#FFFFFF', variant: 'deposit' },
  { label: '[^] WITHDRAW', icon: ArrowUp, bg: '#FFFFFF', textColor: '#121212', iconColor: '#121212', variant: 'withdraw' },
  { label: '[~] SWAP', icon: RefreshCcw, bg: '#FFFF00', textColor: '#121212', iconColor: '#121212', variant: 'swap' },
];

const statusPills = [
  { label: 'Boost Fuel', value: '92%', icon: Rocket },
  { label: 'Signals Armed', value: '18', icon: Flame },
  { label: 'Open Swaps', value: '03', icon: RefreshCcw },
];

const treasuryStats = [
  { label: 'Last Inflow', value: '+ 5,000.00', meta: 'Address · 0x...8a', tone: 'positive' as const },
  { label: 'Last Outflow', value: '- 500.00', meta: 'Profile Boost', tone: 'negative' as const },
  { label: 'Signals Sent', value: '128', meta: 'Past 24h', tone: 'neutral' as const },
];

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatAmount = (value: number) => {
  const absValue = Math.abs(value);
  const prefix = value >= 0 ? '+ ' : '- ';
  return `${prefix}${absValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function BalancePage() {
  const [displayedBalance, setDisplayedBalance] = useState(0);

  useEffect(() => {
    const clashLink = document.createElement('link');
    clashLink.rel = 'stylesheet';
    clashLink.href = 'https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap';
    clashLink.dataset.font = 'clash-display';

    const monoLink = document.createElement('link');
    monoLink.rel = 'stylesheet';
    monoLink.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap';
    monoLink.dataset.font = 'jetbrains-mono';

    document.head.appendChild(clashLink);
    document.head.appendChild(monoLink);

    return () => {
      document.head.removeChild(clashLink);
      document.head.removeChild(monoLink);
    };
  }, []);

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

  return (
    <div className="balance-shell">
      <div className="content-width">
        <div className="global-header" aria-label="PumpInder Asset Management Header">
          <p className="header-mark">PUMPINDER™ // ASSET_MANAGEMENT</p>
          <div className="header-meta" aria-live="polite">
            <span className="net-status">● NET: STABLE</span>
            <span className="token-balance">$PINDER: 14,250.00</span>
          </div>
        </div>

        <div className="status-strip" aria-label="Network telemetry">
          {statusPills.map((pill) => (
            <span key={pill.label} className="status-pill">
              <pill.icon size={16} strokeWidth={2} />
              <span className="pill-label">{pill.label}</span>
              <span className="pill-value">{pill.value}</span>
            </span>
          ))}
        </div>

        <section className="card treasury-card" aria-labelledby="treasury-heading">
          <div className="card-head">
            <h2 id="treasury-heading">THE TREASURY</h2>
            <div className="burn-meta">
              <span>BURN RATE: {BURN_RATE}%</span>
              <div className="burn-bar" role="progressbar" aria-valuenow={BURN_RATE} aria-valuemin={0} aria-valuemax={100}>
                <div className="burn-fill" style={{ width: `${BURN_RATE}%` }} />
              </div>
            </div>
          </div>

          <p className="balance-value">{formatCurrency(Math.min(displayedBalance, TREASURY_BALANCE))}</p>
          <p className="trend-text">+ 12% vs last week</p>

          <div className="action-row">
            {actionButtons.map((button) => (
              <button
                key={button.label}
                type="button"
                className={`action-button action-${button.variant}`}
                style={{ backgroundColor: button.bg, color: button.textColor }}
              >
                <button.icon size={18} strokeWidth={2} color={button.iconColor} />
                <span>{button.label}</span>
              </button>
            ))}
          </div>

          <div className="treasury-stats">
            {treasuryStats.map((stat) => (
              <article key={stat.label} className={`stat-card ${stat.tone}`}>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-meta">{stat.meta}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card ledger-card" aria-labelledby="ledger-heading">
          <div className="ledger-head">
            <h2 id="ledger-heading">TRANSACTION HISTORY</h2>
            <div className="ledger-tools">
              <label className="search-control">
                <Search size={16} strokeWidth={2} color="#121212" aria-hidden="true" />
                <input type="search" placeholder="Q SEARCH..." aria-label="Search transactions" />
              </label>
              <button type="button" className="filter-button">
                <Filter size={16} strokeWidth={2} color="#121212" aria-hidden="true" />
                <span>v FILTER</span>
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

            {ledgerRows.map((row) => {
              const meta = badgeMap[row.type];
              const Icon = meta.icon;

              return (
                <div className="table-row" role="row" key={`${row.time}-${row.entity}`}>
                  <span className="table-cell">{row.time}</span>
                  <span className="table-cell badge-cell">
                    <span className="badge" style={{ backgroundColor: meta.bg, color: meta.textColor }}>
                      <Icon size={14} strokeWidth={2} color={meta.iconColor} aria-hidden="true" />
                      {row.type}
                    </span>
                  </span>
                  <span className="table-cell">{row.entity}</span>
                  <span className={`table-cell amount ${row.amount >= 0 ? 'positive' : 'negative'}`}>
                    {formatAmount(row.amount)}
                  </span>
                </div>
              );
            })}
          </div>

          <nav className="pagination" aria-label="Ledger pagination">
            <button type="button" className="pagination-button" aria-label="Previous page">
              <ChevronLeft size={18} strokeWidth={2} color="#121212" />
            </button>
            <button type="button" className="page-number active" aria-current="page">
              1
            </button>
            <button type="button" className="page-number">2</button>
            <button type="button" className="page-number">3</button>
            <button type="button" className="pagination-button" aria-label="Next page">
              <ChevronRight size={18} strokeWidth={2} color="#121212" />
            </button>
          </nav>
        </section>
      </div>

      <style jsx>{`
        .balance-shell {
          min-height: 100vh;
          background-color: #f4f4f0;
          background-image: linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px);
          background-size: 40px 40px;
          padding: 4rem 1.5rem 5rem;
        }

        .content-width {
          width: min(1200px, 100%);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .global-header {
          position: sticky;
          top: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          z-index: 5;
        }

        .header-mark {
          color: #121212;
          margin: 0;
        }

        .header-meta {
          display: flex;
          flex-direction: column;
          text-align: right;
          gap: 0.35rem;
        }

        .net-status {
          color: #00d668;
          font-weight: 600;
        }

        .token-balance {
          color: #121212;
          font-weight: 600;
        }

        .status-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .status-pill {
          border: 2px solid #121212;
          background: #ffffff;
          box-shadow: 4px 4px 0px #121212;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          padding: 0.55rem 1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pill-label {
          color: #4a4a4a;
        }

        .pill-value {
          font-weight: 700;
          color: #121212;
        }

        .card {
          background: #ffffff;
          border: 4px solid #121212;
          box-shadow: 8px 8px 0px #121212;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
        }

        .card h2 {
          font-family: 'Clash Display', 'JetBrains Mono', monospace;
          font-size: 1.5rem;
          letter-spacing: 0.2em;
          margin: 0;
        }

        .burn-meta {
          font-family: 'JetBrains Mono', monospace;
          text-align: right;
          width: 200px;
        }

        .burn-bar {
          margin-top: 0.75rem;
          height: 10px;
          border: 2px solid #121212;
          background: #e5e5e5;
          position: relative;
        }

        .burn-fill {
          background: #00d668;
          height: 100%;
        }

        .balance-value {
          font-family: 'Clash Display', 'JetBrains Mono', monospace;
          font-size: clamp(3rem, 8vw, 4.5rem);
          margin: 0;
          letter-spacing: 0.08em;
        }

        .trend-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.2rem;
          color: #00d668;
          margin: -1rem 0 0;
        }

        .action-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .action-button {
          border: 2px solid #121212;
          box-shadow: 6px 6px 0px #121212;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1.75rem;
          transition: transform 150ms ease, box-shadow 150ms ease;
        }

        .action-button:hover,
        .action-button:focus-visible {
          transform: translate(-2px, -2px);
          box-shadow: 4px 4px 0px #121212;
        }

        .action-button:focus-visible {
          outline: 3px dashed #ffd700;
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: reduce) {
          .action-button,
          .action-button:hover,
          .action-button:focus-visible {
            transform: none;
            transition: none;
            box-shadow: 6px 6px 0px #121212;
          }
        }

        .treasury-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .stat-card {
          border: 2px solid #121212;
          padding: 1rem;
          background: #fdfdfb;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .stat-card.positive {
          background: #e8fff3;
        }

        .stat-card.negative {
          background: #fff1eb;
        }

        .stat-label {
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.2em;
          color: #4a4a4a;
          margin: 0;
        }

        .stat-value {
          font-family: 'Clash Display', 'JetBrains Mono', monospace;
          font-size: 1.75rem;
          margin: 0;
        }

        .stat-meta {
          font-size: 0.85rem;
          margin: 0;
          color: #121212;
        }

        .ledger-head {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .ledger-tools {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .search-control {
          border: 2px solid #121212;
          background: #ffffff;
          height: 30px;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0 0.75rem;
        }

        .search-control input {
          border: none;
          outline: none;
          background: transparent;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          width: 140px;
        }

        .filter-button {
          border: 2px solid #121212;
          background: #ffffff;
          height: 30px;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0 0.85rem;
          font-family: 'JetBrains Mono', monospace;
          text-transform: uppercase;
          font-size: 1rem;
          letter-spacing: 0.2em;
        }

        .ledger-table {
          border: 2px solid #121212;
        }

        .table-row {
          display: grid;
          grid-template-columns: 15% 20% 35% 30%;
          align-items: center;
          padding: 0.8rem 1rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          letter-spacing: 0.05em;
        }

        .table-row + .table-row {
          border-top: 1px solid #e5e5e5;
        }

        .table-header {
          background: #e5e5e5;
          font-weight: 700;
          text-transform: uppercase;
        }

        .badge-cell {
          display: flex;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.8rem;
          border: 2px solid #121212;
          font-weight: 700;
        }

        .amount {
          text-align: right;
          font-weight: 700;
        }

        .amount.positive {
          color: #00d668;
        }

        .amount.negative {
          color: #ff4d00;
        }

        .pagination {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 0.5rem;
        }

        .pagination-button,
        .page-number {
          border: 2px solid #121212;
          background: #ffffff;
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
        }

        .page-number.active {
          text-decoration: underline;
          font-weight: 700;
        }

        @media (max-width: 900px) {
          .card-head {
            flex-direction: column;
            align-items: flex-start;
          }

          .burn-meta {
            width: 100%;
            text-align: left;
          }

          .table-row {
            grid-template-columns: 1fr 1fr;
            grid-template-areas:
              'date amount'
              'type entity';
            row-gap: 0.5rem;
          }

          .table-row .table-cell:nth-child(1) {
            grid-area: date;
          }

          .table-row .table-cell:nth-child(2) {
            grid-area: type;
          }

          .table-row .table-cell:nth-child(3) {
            grid-area: entity;
          }

          .table-row .table-cell:nth-child(4) {
            grid-area: amount;
          }

          .ledger-tools {
            width: 100%;
            justify-content: space-between;
          }

          .search-control input {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .global-header {
            flex-direction: column;
            gap: 0.5rem;
            text-align: left;
          }

          .header-meta {
            align-items: flex-start;
            text-align: left;
          }

          .status-strip {
            flex-direction: column;
          }

          .action-row {
            flex-direction: column;
          }

          .ledger-tools {
            flex-direction: column;
            align-items: stretch;
          }

          .search-control,
          .filter-button {
            width: 100%;
            justify-content: center;
          }

          .pagination {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
