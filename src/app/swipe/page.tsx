'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  Flame,
  Heart,
  MessageCircle,
  Rocket,
  TrendingUp,
  X,
} from 'lucide-react';

import { AppHeader } from '@/components/AppHeader';
import { useFeePaymentModal } from '@/components/FeePaymentModal';
import { useWallet } from '@/hooks/useWallet';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { useSwipe } from '@/hooks/useSwipe';

const ONBOARDING_STORAGE_KEY = 'pinder_onboarding_payload';
const PROFILE_STORAGE_KEY = 'pinder_profile_extended';
const HANDLE_STORAGE_KEY = 'pinder_handle';

type Profile = {
  id: number;
  name: string;
  handle?: string;
  age: number;
  role: string;
  bio: string;
  about?: string;
  wallet: string;
  level: number;
  walletBadge: string;
  tokens: string[];
  image: string;
  interests?: string[];
  location?: string;
  gender?: string;
  pronouns?: string;
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
    about: '"Looking for a co-founder for a DeFi rug... jk"',
    wallet: '0x...4a2b',
    level: 5,
    walletBadge: 'WHALE',
    tokens: ['$SWIF', '$BONK', '$SOL'],
    image: 'https://picsum.photos/seed/jax/720/720',
    interests: ['defi', 'gaming', 'music'],
    location: 'Berlin, Germany',
    gender: 'MALE',
    pronouns: 'HE / HIM',
  },
  {
    id: 2,
    name: 'Mina',
    age: 26,
    role: 'AI Prompt Shaman',
    bio: 'Shipping decks in public. Will audit vibes for snacks.',
    about: 'Shipping decks in public. Will audit vibes for snacks.',
    wallet: '0x...91ff',
    level: 7,
    walletBadge: 'ALPHA',
    tokens: ['$PUMP', '$JUP', '$HNT'],
    image: 'https://picsum.photos/seed/mina/720/720',
    interests: ['nfts', 'art', 'photography'],
    location: 'San Francisco, CA',
    gender: 'FEMALE',
    pronouns: 'SHE / HER',
  },
  {
    id: 3,
    name: 'Theo',
    age: 32,
    role: 'On-chain Sleuth',
    bio: 'I bookmark token bonding curves for fun.',
    about: 'I bookmark token bonding curves for fun.',
    wallet: '0x...be12',
    level: 4,
    walletBadge: 'SCANNER',
    tokens: ['$PYTH', '$TIA', '$WIF'],
    image: 'https://picsum.photos/seed/theo/720/720',
    interests: ['trading', 'reading', 'fitness'],
    location: 'London, UK',
    gender: 'MALE',
    pronouns: 'HE / HIM',
  },
  {
    id: 4,
    name: 'Aria',
    age: 24,
    role: 'Pump.fun Top 10%',
    bio: 'Pixel artist by day, memecoin whisperer by night.',
    about: 'Pixel artist by day, memecoin whisperer by night.',
    wallet: '0x...af88',
    level: 9,
    walletBadge: 'DEGEN',
    tokens: ['$CAT', '$BODEN', '$FIDA'],
    image: 'https://picsum.photos/seed/aria/720/720',
    interests: ['memes', 'art', 'music'],
    location: 'New York, NY',
    gender: 'FEMALE',
    pronouns: 'SHE / THEY',
  },
];

type SwipeFilters = {
  token: string;
  interests: string[];
  location: string;
  gender: string;
};

const createDefaultFilters = (): SwipeFilters => ({
  token: 'ANY',
  interests: [],
  location: 'ANY',
  gender: 'ANY',
});

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

const loadUserProfile = (): Profile | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    const onboardingData = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    const storedHandle = localStorage.getItem(HANDLE_STORAGE_KEY);
    
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
      let age = 25;
      
      if (onboardingData) {
        const onboarding = JSON.parse(onboardingData);
        if (onboarding.birthday) {
          const birthYear = new Date(onboarding.birthday).getFullYear();
          const currentYear = new Date().getFullYear();
          age = currentYear - birthYear;
        }
      }
      
      return {
        id: 999,
        name: parsed.name || 'Anonymous',
        handle: storedHandle || parsed.name || 'ANON',
        age: age,
        role: parsed.jobTitle || 'Web3 Enthusiast',
        bio: parsed.about || 'No bio available',
        about: parsed.about || 'No bio available',
        wallet: '0x...USER',
        level: 1,
        walletBadge: 'USER',
        tokens: parsed.favoriteTokens || [],
        image: parsed.photos?.[0] || 'https://picsum.photos/seed/user/720/720',
      };
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
  
  return null;
};

export default function SwipePage() {
  const [draftFilters, setDraftFilters] = useState<SwipeFilters>(() => createDefaultFilters());
  const [appliedFilters, setAppliedFilters] = useState<SwipeFilters>(() => createDefaultFilters());
  const [notifications, setNotifications] = useState(notificationSeed);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardAnimation, setCardAnimation] = useState<CardAnimation>(null);
  const [isBoosting, setIsBoosting] = useState(false);

  const { Modal, initiatePayment } = useFeePaymentModal();
  const { isConnected } = useWallet();
  const { hasLinkedAccount } = useSocialAuth();

  const userProfile = loadUserProfile();
  
  // Check if user can continue swiping
  const canContinueSwiping = isConnected && hasLinkedAccount;
  
  const handleContinueSwiping = () => {
    // This callback is called when authentication is complete
    // The swipe functionality will work normally once authenticated
    console.log('Authentication complete, user can continue swiping');
  };
  
  const dynamicProfileDeck = useMemo(() => {
    if (userProfile) {
      return [userProfile, ...profileDeck];
    }
    return profileDeck;
  }, [userProfile]);

  const availableTokens = useMemo(() => {
    const tokenSet = new Set<string>();
    dynamicProfileDeck.forEach((profile) => {
      profile.tokens.forEach((token) => tokenSet.add(token));
    });
    return Array.from(tokenSet).sort();
  }, [dynamicProfileDeck]);

  const availableInterests = useMemo(() => {
    const interestSet = new Set<string>();
    dynamicProfileDeck.forEach((profile) => {
      profile.interests?.forEach((interest) => interestSet.add(interest));
    });
    return Array.from(interestSet).sort();
  }, [dynamicProfileDeck]);

  const availableLocations = useMemo(() => {
    return Array.from(new Set(dynamicProfileDeck.map((profile) => profile.location).filter(Boolean))).sort();
  }, [dynamicProfileDeck]);

  const availableGenders = useMemo(() => {
    return Array.from(new Set(dynamicProfileDeck.map((profile) => profile.gender).filter(Boolean))).sort();
  }, [dynamicProfileDeck]);

  const filteredDeck = useMemo(() => {
    return dynamicProfileDeck.filter((profile) => {
      if (appliedFilters.token !== 'ANY' && !profile.tokens.includes(appliedFilters.token)) return false;
      if (appliedFilters.interests.length && !appliedFilters.interests.some((i) => profile.interests?.includes(i))) return false;
      if (appliedFilters.location !== 'ANY' && profile.location !== appliedFilters.location) return false;
      if (appliedFilters.gender !== 'ANY' && profile.gender !== appliedFilters.gender) return false;
      return true;
    });
  }, [dynamicProfileDeck, appliedFilters]);

  const deckInUse = filteredDeck.length > 0 ? filteredDeck : dynamicProfileDeck;
  const activeProfile = deckInUse[activeIndex % deckInUse.length];
  const secondaryProfiles = [1, 2].map((offset) => deckInUse[(activeIndex + offset) % deckInUse.length]);

  const advanceCard = (direction: CardAnimation) => {
    if (cardAnimation) return;
    
    // Check if user is authenticated before allowing swipe
    if (!canContinueSwiping) {
      // The ConnectWalletButton will handle showing the authentication modal
      return;
    }
    
    setCardAnimation(direction);
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % dynamicProfileDeck.length);
      setCardAnimation(null);
    }, 320);
  };

  const handleBoost = async () => {
    if (isBoosting) return;
    
    // Check if user is authenticated before allowing boost
    if (!canContinueSwiping) {
      return;
    }
    
    setIsBoosting(true);
    
    // Initiate payment for SUPERLIKE
    await initiatePayment('SUPERLIKE');
  };

  const handleLike = async () => {
    // Check if user is authenticated before allowing like
    if (!canContinueSwiping) {
      return;
    }
    
    // Initiate payment for LIKE
    await initiatePayment('LIKE');
  };

  const { swipeHandlers, getTransformStyle, swipeDirection, swipeOpacity, isDragging } = useSwipe({
    onSwipeLeft: () => advanceCard('left'),
    onSwipeRight: handleLike,
    onSwipeUp: () => advanceCard('up'),
    threshold: 140,
    verticalThreshold: 160,
    isProcessing: false,
  });

  const currentCardStyle = cardAnimation ? {} : getTransformStyle();
  const cardAnimationClass = cardAnimation ? `swipe-card--animate-${cardAnimation}` : '';

  const handleApplyFilters = () => {
    setAppliedFilters((prev) => ({
      ...prev,
    }));
    setActiveIndex(0);
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

  return (
    <div className="swipe-page">
      <AppHeader activePage="swipe" onContinueSwiping={handleContinueSwiping} />

      <main className="swipe-grid">
        <section className="filters-panel" aria-labelledby="filters-heading">
          <div className="frame-heading" id="filters-heading">
            <span>FILTERS</span>
          </div>

          {availableInterests.length > 0 && (
            <div className="filters-block">
              <label className="filters-label" htmlFor="interests-select">
                INTEREST:
              </label>
              <div className="input-shell">
                <select
                  id="interests-select"
                  className="dropdown-select"
                  value={draftFilters.interests[0] ?? 'ANY'}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      interests:
                        event.target.value === 'ANY' ? [] : [event.target.value],
                    }))
                  }
                >
                  <option value="ANY">ANY INTEREST</option>
                  {availableInterests.map((interest) => (
                    <option key={interest} value={interest}>
                      {interest.toUpperCase()}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} />
              </div>
            </div>
          )}

          {availableLocations.length > 0 && (
            <div className="filters-block">
              <label className="filters-label" htmlFor="location-select">
                LOCATION:
              </label>
              <div className="input-shell">
                <select
                  id="location-select"
                  className="dropdown-select"
                  value={draftFilters.location}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({ ...prev, location: event.target.value }))
                  }
                >
                  <option value="ANY">ANY LOCATION</option>
                  {availableLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} />
              </div>
            </div>
          )}

          {availableGenders.length > 0 && (
            <div className="filters-block">
              <label className="filters-label" htmlFor="gender-select">
                GENDER:
              </label>
              <div className="input-shell">
                <select
                  id="gender-select"
                  className="dropdown-select"
                  value={draftFilters.gender}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({ ...prev, gender: event.target.value }))
                  }
                >
                  <option value="ANY">ANY GENDER</option>
                  {availableGenders.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} />
              </div>
            </div>
          )}

          <div className="filters-block">
            <label className="filters-label" htmlFor="token-select">
              TOKEN HELD:
            </label>
            <div className="input-shell">
              <select
                id="token-select"
                className="dropdown-select"
                value={draftFilters.token}
                onChange={(event) =>
                  setDraftFilters((prev) => ({ ...prev, token: event.target.value }))
                }
              >
                <option value="ANY">ANY TOKEN</option>
                {availableTokens.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} />
            </div>
          </div>

          <button type="button" className="apply-button" onClick={handleApplyFilters}>
            APPLY FILTERS
          </button>
          {filteredDeck.length === 0 && (
            <p className="filters-footnote">No exact matches. Showing full deck instead.</p>
          )}
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
                  <div className="user-username">
                    @{activeProfile.handle || activeProfile.name}
                  </div>
                  <div className="token-badges token-badges--inline">
                    {activeProfile.tokens.map((token) => (
                      <span key={token}>{token}</span>
                    ))}
                  </div>
                </div>

                <div className="card-identity">
                  <h1 className="display-font card-name">
                    {activeProfile.name.toUpperCase()}, {activeProfile.age}
                  </h1>
                  <p className="ui-font card-role">{activeProfile.role}</p>
                  <p className="ui-font card-bio">{activeProfile.about || activeProfile.bio}</p>
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
                {isBoosting ? 'SUPERLIKING…' : 'SUPERLIKE'}
              </button>
              <span className="cost-label">-$2</span>
            </div>
            <div className="control-button">
              <button
                type="button"
                className="mech-button mech-button--signal"
                onClick={handleLike}
              >
                <Heart size={28} />
                LIKE
              </button>
              <span className="cost-label">-$0.5</span>
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
      
      {/* Fee Payment Modal */}
      <Modal />
    </div>
  );
}
