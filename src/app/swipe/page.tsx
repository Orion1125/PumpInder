'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Heart,
  MessageCircle,
  Rocket,
  Star,
  Users,
  X,
} from 'lucide-react';

import { AppHeader } from '@/components/AppHeader';
import { useFeePaymentModal } from '@/components/FeePaymentModal';
import { useWallet } from '@/hooks/useWallet';
import { useProfiles, DiscoverProfile } from '@/hooks/useProfiles';
import { useSwipe } from '@/hooks/useSwipe';
import { useSolPrice } from '@/hooks/useSolPrice';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useUserProfile } from '@/hooks/useUserProfile';
import { FEE_AMOUNTS_USD } from '@/constants/tokens';

type CardAnimation = 'left' | 'right' | 'up' | null;

type SwipeFilters = {
  interests: string[];
  location: string;
  gender: string;
};

const createDefaultFilters = (): SwipeFilters => ({
  interests: [],
  location: 'ANY',
  gender: 'ANY',
});

function getAge(birthday: string): number {
  if (!birthday) return 0;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function SwipePage() {
  const [draftFilters, setDraftFilters] = useState<SwipeFilters>(() => createDefaultFilters());
  const [appliedFilters, setAppliedFilters] = useState<SwipeFilters>(() => createDefaultFilters());
  const [filtersAutoApplied, setFiltersAutoApplied] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardAnimation, setCardAnimation] = useState<CardAnimation>(null);
  const [isBoosting, setIsBoosting] = useState(false);

  const { Modal, initiatePayment } = useFeePaymentModal();
  const { isConnected, publicKey } = useWallet();
  const { profiles, isLoading, removeProfile, rotateProfileToBottom } = useProfiles();
  const { solPrice, usdToSol } = useSolPrice();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { profile: userProfile } = useUserProfile();

  // Auto-populate filters from user profile on first load
  useEffect(() => {
    if (filtersAutoApplied || !userProfile || profiles.length === 0) return;

    const autoFilters: SwipeFilters = {
      interests: userProfile.interests?.length ? userProfile.interests : [],
      location: userProfile.location || 'ANY',
      gender: 'ANY', // Don't auto-filter gender — let user pick preference
    };

    setDraftFilters(autoFilters);
    setAppliedFilters(autoFilters);
    setFiltersAutoApplied(true);
    setActiveIndex(0);
  }, [userProfile, profiles, filtersAutoApplied]);

  const availableInterests = useMemo(() => {
    const interestSet = new Set<string>();
    profiles.forEach((p) => p.interests?.forEach((i) => interestSet.add(i)));
    return Array.from(interestSet).sort();
  }, [profiles]);

  const availableLocations = useMemo(() => {
    return Array.from(new Set(profiles.map((p) => p.location).filter(Boolean))).sort();
  }, [profiles]);

  const availableGenders = useMemo(() => {
    return Array.from(new Set(profiles.map((p) => p.gender).filter(Boolean))).sort();
  }, [profiles]);

  const filteredDeck = useMemo(() => {
    return profiles.filter((profile) => {
      if (appliedFilters.interests.length && !appliedFilters.interests.some((i) => profile.interests?.includes(i))) return false;
      if (appliedFilters.location !== 'ANY' && profile.location !== appliedFilters.location) return false;
      if (appliedFilters.gender !== 'ANY' && profile.gender !== appliedFilters.gender) return false;
      return true;
    });
  }, [profiles, appliedFilters]);

  const deckInUse = filteredDeck.length > 0 ? filteredDeck : profiles;
  const activeProfile: DiscoverProfile | null = deckInUse.length > 0 ? deckInUse[activeIndex % deckInUse.length] : null;
  const secondaryProfiles = activeProfile
    ? [1, 2].map((offset) => deckInUse[(activeIndex + offset) % deckInUse.length])
    : [];

  const recordSwipe = async (direction: 'left' | 'right' | 'superlike') => {
    if (!publicKey || !activeProfile) return;
    try {
      await fetch('/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swiperWallet: publicKey,
          swipedWallet: activeProfile.walletPublicKey,
          direction: direction === 'superlike' ? 'right' : direction,
        }),
      });
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
  };

  const advanceCard = async (direction: CardAnimation) => {
    if (cardAnimation || !isConnected || !activeProfile) return;

    if (direction === 'left') {
      await recordSwipe('left');
      // Pass → rotate profile to the bottom of the deck instead of removing
      rotateProfileToBottom(activeProfile.walletPublicKey);
    }

    setCardAnimation(direction);
    setTimeout(() => {
      setActiveIndex(0); // always show the top card after rotation
      setCardAnimation(null);
    }, 320);
  };

  const handleBoost = async () => {
    if (isBoosting || !isConnected || !activeProfile) return;
    const targetWallet = activeProfile.walletPublicKey;
    setIsBoosting(true);
    await initiatePayment('SUPERLIKE', targetWallet, async () => {
      // Only record swipe + remove from deck after successful payment
      await recordSwipe('superlike');
      removeProfile(targetWallet);
      setActiveIndex(0);
    });
    setIsBoosting(false);
  };

  const handleLike = async () => {
    if (!isConnected || !activeProfile) return;
    const targetWallet = activeProfile.walletPublicKey;
    await initiatePayment('LIKE', targetWallet, async () => {
      // Only record swipe + remove from deck after successful payment
      await recordSwipe('right');
      removeProfile(targetWallet);
      setActiveIndex(0);
    });
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
    setAppliedFilters({ ...draftFilters });
    setActiveIndex(0);
  };

  return (
    <div className="swipe-page">
      <AppHeader activePage="swipe" />

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
                  value={draftFilters.interests.length > 1 ? 'MY_INTERESTS' : (draftFilters.interests[0] ?? 'ANY')}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      interests: event.target.value === 'ANY'
                        ? []
                        : event.target.value === 'MY_INTERESTS'
                          ? (userProfile?.interests || [])
                          : [event.target.value],
                    }))
                  }
                >
                  <option value="ANY">ANY INTEREST</option>
                  {userProfile?.interests?.length ? (
                    <option value="MY_INTERESTS">MY INTERESTS ({userProfile.interests.length})</option>
                  ) : null}
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

          <button type="button" className="apply-button" onClick={handleApplyFilters}>
            APPLY FILTERS
          </button>
          {filteredDeck.length === 0 && profiles.length > 0 && (
            <p className="filters-footnote">No exact matches. Showing full deck instead.</p>
          )}
        </section>

        <section className="swipe-center" aria-live="polite">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <p className="ui-font text-sm text-ink-secondary uppercase tracking-widest">Loading profiles...</p>
            </div>
          ) : !activeProfile ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="display-font text-2xl tracking-widest mb-4">NO MORE PROFILES</p>
                <p className="ui-font text-sm text-ink-secondary">Check back later for new people to discover.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="card-stack">
                {secondaryProfiles.map((profile, index) => (
                  <div
                    key={`${profile.id}-ghost-${index}`}
                    className={`stack-ghost ghost-${index}`}
                    aria-hidden="true"
                  >
                    {profile.photos?.[0] && (
                      <Image
                        src={profile.photos[0]}
                        alt={`${profile.handle} preview`}
                        fill
                        sizes="(max-width: 768px) 100vw, 420px"
                      />
                    )}
                  </div>
                ))}

                <div
                  className={`swipe-card ${cardAnimationClass}`}
                  {...swipeHandlers}
                  style={{ ...currentCardStyle, cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                  <div className="swipe-card__image">
                    {activeProfile.photos?.[0] && (
                      <Image
                        src={activeProfile.photos[0]}
                        alt={`${activeProfile.handle} profile image`}
                        fill
                        sizes="(max-width: 768px) 94vw, 520px"
                        priority
                      />
                    )}
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
                        @{activeProfile.handle}
                      </div>
                    </div>

                    <div className="card-identity">
                      <h1 className="display-font card-name">
                        {activeProfile.handle.toUpperCase()}, {getAge(activeProfile.birthday)}
                      </h1>
                      <p className="ui-font card-role">{activeProfile.occupation || 'Web3 Enthusiast'}</p>
                      <p className="ui-font card-bio">{activeProfile.bio || ''}</p>
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
                  <span className="cost-label">
                    {usdToSol(FEE_AMOUNTS_USD.SUPERLIKE) !== null
                      ? `-${usdToSol(FEE_AMOUNTS_USD.SUPERLIKE)!.toFixed(4)} SOL ($${FEE_AMOUNTS_USD.SUPERLIKE})`
                      : '-2 SOL'}
                  </span>
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
                  <span className="cost-label">
                    {usdToSol(FEE_AMOUNTS_USD.LIKE) !== null
                      ? `-${usdToSol(FEE_AMOUNTS_USD.LIKE)!.toFixed(4)} SOL ($${FEE_AMOUNTS_USD.LIKE})`
                      : '-0.5 SOL'}
                  </span>
                </div>
              </div>

            </>
          )}
        </section>

        <section className="notifications-panel" aria-labelledby="notifications-heading">
          <div className="frame-heading" id="notifications-heading">
            <span>NOTIFICATIONS{unreadCount > 0 ? ` (${unreadCount})` : ''}</span>
          </div>

          <ul className="notifications-list">
            {notifications.length === 0 ? (
              <li className="notification-item status-read">
                <p className="notification-text ui-font text-sm text-ink-secondary">No new notifications</p>
              </li>
            ) : (
              notifications.slice(0, 8).map((notif) => (
                <li
                  key={notif.id}
                  className={`notification-item ${notif.read ? 'status-read' : notif.type === 'match' ? 'status-alert' : 'status-new'}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="notification-icon">
                    {notif.type === 'message' && <MessageCircle size={18} />}
                    {notif.type === 'like' && <Heart size={18} />}
                    {notif.type === 'superlike' && <Star size={18} />}
                    {notif.type === 'match' && <Users size={18} />}
                  </div>
                  <div className="notification-body">
                    <p className="notification-text ui-font text-sm">
                      <span className="font-bold">@{notif.fromHandle}</span>
                    </p>
                    <p className="notification-text ui-font text-xs text-ink-secondary">{notif.preview}</p>
                    <time className="notification-time ui-font text-[0.65rem] text-ink-secondary">
                      {formatTimeAgo(notif.createdAt)}
                    </time>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>

      {/* Live SOL price indicator — always visible */}
      <div className="sol-price-ticker">
        {solPrice
          ? <span className="ui-font text-[0.68rem] tracking-[0.2em] uppercase">SOL ${solPrice.toFixed(2)}</span>
          : <span className="ui-font text-[0.68rem] tracking-[0.2em] uppercase text-ink-secondary">SOL ---</span>
        }
      </div>
      
      <Modal />
    </div>
  );
}
