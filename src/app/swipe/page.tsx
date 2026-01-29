'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Edit,
  Flame,
  Heart,
  Maximize,
  MessageCircle,
  Rocket,
  Settings,
  ToggleRight,
  TrendingUp,
  User,
  X,
} from 'lucide-react';

import { useSwipe } from '@/hooks/useSwipe';

type Profile = {
  id: number;
  name: string;
  age: number;
  role: string;
  bio: string;
  wallet: string;
  level: number;
  walletBadge: string;
  tokens: string[];
  image: string;
};

type CardAnimation = 'left' | 'right' | 'up' | null;

type NotificationStatus = 'new' | 'read' | 'alert';

type NotificationItem = {
  id: number;
  content: string;
  status: NotificationStatus;
  icon: 'flame' | 'rocket' | 'message' | 'alert' | 'trend';
  accent?: string;
};

const profileDeck: Profile[] = [
  {
    id: 1,
    name: 'Jax',
    age: 28,
    role: 'Solidity Dev // DJ',
    bio: '"Looking for a co-founder for a DeFi rug... jk"',
    wallet: '0x...4a2b',
    level: 5,
    walletBadge: 'WHALE',
    tokens: ['$SWIF', '$BONK', '$SOL'],
    image: 'https://picsum.photos/seed/jax/720/720',
  },
  {
    id: 2,
    name: 'Mina',
    age: 26,
    role: 'AI Prompt Shaman',
    bio: 'Shipping decks in public. Will audit vibes for snacks.',
    wallet: '0x...91ff',
    level: 7,
    walletBadge: 'ALPHA',
    tokens: ['$PUMP', '$JUP', '$HNT'],
    image: 'https://picsum.photos/seed/mina/720/720',
  },
  {
    id: 3,
    name: 'Theo',
    age: 32,
    role: 'On-chain Sleuth',
    bio: 'I bookmark token bonding curves for fun.',
    wallet: '0x...be12',
    level: 4,
    walletBadge: 'SCANNER',
    tokens: ['$PYTH', '$TIA', '$WIF'],
    image: 'https://picsum.photos/seed/theo/720/720',
  },
  {
    id: 4,
    name: 'Aria',
    age: 24,
    role: 'Pump.fun Top 10%',
    bio: 'Pixel artist by day, memecoin whisperer by night.',
    wallet: '0x...af88',
    level: 9,
    walletBadge: 'DEGEN',
    tokens: ['$CAT', '$BODEN', '$FIDA'],
    image: 'https://picsum.photos/seed/aria/720/720',
  },
];

const walletAgeOptions = ['LAST 7 DAYS', 'LAST 30 DAYS', 'LAST 90 DAYS', 'ALL TIME'];

const notificationSeed: NotificationItem[] = [
  { id: 1, content: '@0x...bb MATCHED!', status: 'new', icon: 'flame', accent: '#00D668' },
  { id: 2, content: 'Your profile BOOSTED!', status: 'new', icon: 'rocket', accent: '#FF4D00' },
  { id: 3, content: '@0x...ce sent DM', status: 'read', icon: 'message' },
  { id: 4, content: '! Low $PINDER Balance', status: 'alert', icon: 'alert', accent: '#FF4D00' },
  { id: 5, content: 'New $WIF high alert', status: 'read', icon: 'trend' },
];

const iconMap = {
  flame: Flame,
  rocket: Rocket,
  message: MessageCircle,
  alert: AlertCircle,
  trend: TrendingUp,
};

export default function SwipePage() {
  const router = useRouter();
  const [range, setRange] = useState(10);
  const [tokenHeld, setTokenHeld] = useState('$SWIF');
  const [walletAge, setWalletAge] = useState('LAST 30 DAYS');
  const [filterToggles, setFilterToggles] = useState({
    onlineNow: true,
    pumpFun: true,
    newWallets: false,
  });
  const [notifications, setNotifications] = useState(notificationSeed);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardAnimation, setCardAnimation] = useState<CardAnimation>(null);
  const [isBoosting, setIsBoosting] = useState(false);

  const activeProfile = profileDeck[activeIndex % profileDeck.length];
  const secondaryProfiles = useMemo(() => {
    return [1, 2].map((offset) => profileDeck[(activeIndex + offset) % profileDeck.length]);
  }, [activeIndex]);

  const advanceCard = (direction: CardAnimation) => {
    if (cardAnimation) return;
    setCardAnimation(direction);
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % profileDeck.length);
      setCardAnimation(null);
    }, 320);
  };

  const handleBoost = () => {
    if (isBoosting) return;
    setIsBoosting(true);
    setTimeout(() => {
      setIsBoosting(false);
      advanceCard('up');
    }, 520);
  };

  const { swipeHandlers, getTransformStyle, swipeDirection, swipeOpacity, isDragging } = useSwipe({
    onSwipeLeft: () => advanceCard('left'),
    onSwipeRight: () => advanceCard('right'),
    onSwipeUp: () => advanceCard('up'),
    threshold: 140,
    verticalThreshold: 160,
    isProcessing: false,
  });

  const currentCardStyle = cardAnimation ? {} : getTransformStyle();
  const cardAnimationClass = cardAnimation ? `swipe-card--animate-${cardAnimation}` : '';

  const handleToggle = (key: keyof typeof filterToggles) => {
    setFilterToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApplyFilters = () => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.status === 'new'
          ? { ...item, status: 'read' as NotificationStatus }
          : item,
      ),
    );
  };

  const handleNotificationClick = (id: number) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'alert' ? 'alert' : 'read',
            }
          : item,
      ),
    );
  };

  const clearNotifications = () => setNotifications([]);

  const handleProfileAction = (path: string) => {
    router.push(path);
  };

  return (
    <div className="swipe-page">
      <header className="swipe-header">
        <button className="swipe-logo" aria-label="PumpInder home">
          PUMPINDER™
        </button>
        <nav className="swipe-nav-toggle" aria-label="Primary navigation">
          <button className="is-active">Swipe</button>
          <button onClick={() => router.push('/chat')}>Chat</button>
        </nav>
        <div className="swipe-header-right">
          <button 
            className="swipe-balance" 
            aria-label="Wallet summary"
            onClick={() => router.push('/balance')}
          >
            <span className="ui-font text-value">4,200</span>
            <span className="ui-font text-label">$PINDER</span>
          </button>
          <div className="profile-dropdown-container">
            <button className="profile-button" aria-label="Profile">
              <User size={20} strokeWidth={2} />
            </button>
            <div className="profile-dropdown" role="menu" aria-label="Profile actions">
              <button
                className="profile-dropdown-item"
                role="menuitem"
                onClick={() => handleProfileAction('/profile/edit')}
              >
                <Edit size={16} strokeWidth={2} />
                Edit Profile
              </button>
              <button
                className="profile-dropdown-item"
                role="menuitem"
                onClick={() => handleProfileAction('/settings')}
              >
                <Settings size={16} strokeWidth={2} />
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="swipe-grid">
        <section className="filters-panel" aria-labelledby="filters-heading">
          <div className="frame-heading" id="filters-heading">
            <span>FILTERS</span>
          </div>

          <div className="filters-block">
            <div className="filters-label">
              <Maximize size={18} />
              <span>RANGE: {range} KM</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={range}
              onChange={(event) => setRange(Number(event.target.value))}
              className="range-slider"
            />
          </div>

          <div className="filters-block">
            <p className="filters-label">SHOW:</p>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-pill ${filterToggles.onlineNow ? 'is-on' : ''}`}
                onClick={() => handleToggle('onlineNow')}
              >
                <span>ONLINE NOW</span>
                <ToggleRight
                  size={26}
                  strokeWidth={2.5}
                  className="toggle-icon"
                  style={{ transform: filterToggles.onlineNow ? 'rotate(0deg)' : 'rotate(180deg)' }}
                />
              </button>
              <button
                type="button"
                className={`toggle-pill ${filterToggles.pumpFun ? 'is-on' : ''}`}
                onClick={() => handleToggle('pumpFun')}
              >
                <span>PUMP.FUN DEGENS</span>
                <ToggleRight
                  size={26}
                  strokeWidth={2.5}
                  className="toggle-icon"
                  style={{ transform: filterToggles.pumpFun ? 'rotate(0deg)' : 'rotate(180deg)' }}
                />
              </button>
              <button
                type="button"
                className={`toggle-pill ${filterToggles.newWallets ? 'is-on' : ''}`}
                onClick={() => handleToggle('newWallets')}
              >
                <span>NEW WALLETS (24H)</span>
                <ToggleRight
                  size={26}
                  strokeWidth={2.5}
                  className="toggle-icon"
                  style={{ transform: filterToggles.newWallets ? 'rotate(0deg)' : 'rotate(180deg)' }}
                />
              </button>
            </div>
          </div>

          <div className="filters-block">
            <label className="filters-label" htmlFor="token-input">
              TOKEN HELD:
            </label>
            <div className="input-shell">
              <input
                id="token-input"
                type="text"
                value={tokenHeld}
                onChange={(event) => setTokenHeld(event.target.value.toUpperCase())}
                placeholder="Input: $TOKEN_SYMBOL"
              />
              <ChevronDown size={18} />
            </div>
          </div>

          <div className="filters-block">
            <label className="filters-label" htmlFor="wallet-age">
              WALLET AGE:
            </label>
            <div className="input-shell">
              <select
                id="wallet-age"
                className="dropdown-select"
                value={walletAge}
                onChange={(event) => setWalletAge(event.target.value)}
              >
                {walletAgeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="button" className="apply-button" onClick={handleApplyFilters}>
            APPLY FILTERS
          </button>
        </section>

        <section className="swipe-center" aria-live="polite">
          <div className="card-stack">
            {secondaryProfiles.map((profile, index) => (
              <div
                key={`${profile.id}-ghost-${index}`}
                className={`stack-ghost ghost-${index}`}
                aria-hidden="true"
              >
                <Image
                  src={profile.image}
                  alt={`${profile.name} preview`}
                  fill
                  sizes="(max-width: 768px) 100vw, 420px"
                />
              </div>
            ))}

            <div
              className={`swipe-card ${cardAnimationClass}`}
              {...swipeHandlers}
              style={{ ...currentCardStyle, cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <div className="swipe-card__image">
                <Image
                  src={activeProfile.image}
                  alt={`${activeProfile.name} profile image`}
                  fill
                  sizes="(max-width: 768px) 94vw, 520px"
                  priority
                />
              </div>
              {swipeDirection && (
                <div
                  className="swipe-card__ink"
                  style={{
                    opacity: swipeOpacity,
                    backgroundColor:
                      swipeDirection === 'left'
                        ? '#FF4D00'
                        : swipeDirection === 'right'
                          ? '#00D668'
                          : '#5D5FEF',
                  }}
                />
              )}

              <div className="swipe-card__body">
                <div className="card-strip">
                  <span>[ lvl {activeProfile.level} ]</span>
                  <span className="strip-wallet">{activeProfile.wallet}</span>
                  <span className="card-strip__badge">{activeProfile.walletBadge}</span>
                </div>

                <div className="card-identity">
                  <h1 className="display-font card-name">
                    {activeProfile.name.toUpperCase()}, {activeProfile.age}
                    <Check size={20} className="verified" />
                  </h1>
                  <p className="ui-font card-role">{activeProfile.role}</p>
                  <p className="ui-font card-bio">{activeProfile.bio}</p>
                </div>

                <div className="token-badges">
                  {activeProfile.tokens.map((token) => (
                    <span key={token}>{token}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="control-deck">
            <div className="control-button">
              <button type="button" className="mech-button mech-button--neutral" onClick={() => advanceCard('left')}>
                <X size={28} />
                PASS
              </button>
              <span className="cost-label">FREE</span>
            </div>
            <div className="control-button">
              <button
                type="button"
                className="mech-button mech-button--boost"
                onClick={handleBoost}
                disabled={isBoosting}
              >
                <Rocket size={28} />
                {isBoosting ? 'BOOSTING…' : 'BOOST'}
              </button>
              <span className="cost-label">-500 $PINDER</span>
            </div>
            <div className="control-button">
              <button
                type="button"
                className="mech-button mech-button--signal"
                onClick={() => advanceCard('right')}
              >
                <Heart size={28} />
                SIGNAL
              </button>
              <span className="cost-label">-100 $PINDER</span>
            </div>
          </div>
        </section>

        <section className="notifications-panel" aria-labelledby="notifications-heading">
          <div className="frame-heading" id="notifications-heading">
            <span>NOTIFICATIONS</span>
          </div>

          <ul className="notifications-list">
            {notifications.map((notification) => {
              const Icon = iconMap[notification.icon];
              return (
                <li
                  key={notification.id}
                  className={`notification-item status-${notification.status}`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <span
                    className="notification-icon"
                    style={{ backgroundColor: notification.accent ?? '#FFFFFF' }}
                  >
                    <Icon size={18} />
                  </span>
                  <p className="notification-text">{notification.content}</p>
                </li>
              );
            })}
          </ul>

          <button type="button" className="clear-button" onClick={clearNotifications}>
            CLEAR ALL NOTIFS
          </button>
        </section>
      </main>
    </div>
  );
}
