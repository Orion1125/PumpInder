'use client';

import Image from 'next/image';
import { UserProfile } from '@/types';
import { useSwipe } from '@/hooks/useSwipe';
import { BriefcaseIcon, CloseIcon, HeartIcon, LocationIcon } from './Icons';
import { ReactionsPanel } from './ReactionsPanel';
import { ReactionType } from '@/types/reactions';

interface ProfileCardProps {
  profile: UserProfile;
  onLike: (profileId: number) => void;
  onPass: (profileId: number) => void;
  onReaction: (profileId: number, type: ReactionType) => void;
  balance: number;
  isProcessing: boolean;
  animation: 'left' | 'right' | 'up' | null;
  showReactions: boolean;
  onToggleReactions: () => void;
}

const SwipeFeedback = ({ direction, opacity }: { direction: 'left' | 'right' | 'up'; opacity: number }) => {
  const isLike = direction === 'right';
  const isSuper = direction === 'up';
  const text = isSuper ? 'SUPERLIKE' : isLike ? 'LIKE' : 'NOPE';
  const colorClass = isSuper
    ? 'border-pinder-purple text-pinder-purple'
    : isLike
      ? 'border-pinder-pink text-pinder-pink'
      : 'border-red-500 text-red-500';
  const rotationClass = isSuper ? '' : isLike ? '-rotate-12' : 'rotate-12';
  const positionClass = isSuper ? 'left-1/2 -translate-x-1/2 top-6' : isLike ? 'left-8 top-12' : 'right-8 top-12';

  return (
    <div
      style={{ opacity }}
      className={`absolute ${positionClass} transform ${rotationClass} border-4 ${colorClass} rounded-2xl px-8 py-2 transition-opacity duration-100`}
    >
      <span className="text-4xl font-black tracking-wider">{text}</span>
    </div>
  );
};

export function ProfileCard({ 
  profile, 
  onLike, 
  onPass, 
  onReaction, 
  balance,
  isProcessing, 
  animation, 
  showReactions, 
  onToggleReactions 
}: ProfileCardProps) {
  const { swipeHandlers, getTransformStyle, swipeDirection, swipeOpacity, isDragging } = useSwipe({
    onSwipeLeft: () => onPass(profile.id),
    onSwipeRight: () => onLike(profile.id),
    onSwipeUp: () => onToggleReactions(),
    isProcessing,
    threshold: 120,
  });

  const animationClass =
    animation === 'left'
      ? 'animate-slide-out-left'
      : animation === 'right'
        ? 'animate-slide-out-right'
        : animation === 'up'
          ? 'animate-slide-out-up'
          : 'animate-fade-in';

  const style = animation ? {} : getTransformStyle();

  return (
    <div
      {...swipeHandlers}
      style={{ ...style, cursor: isProcessing ? 'default' : isDragging ? 'grabbing' : 'grab' }}
      className={`relative w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-pinder-purple/10 ${animationClass} touch-none select-none`}
    >
      <Image
        src={profile.imageUrl}
        alt={profile.name}
        fill
        sizes="(max-width: 768px) 100vw, 420px"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        priority
      />

      {isDragging && swipeDirection && <SwipeFeedback direction={swipeDirection} opacity={swipeOpacity} />}

      <div className="absolute inset-0 bg-black/60" />

      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div>
          <h2 className="text-4xl font-bold">{profile.name}, {profile.age}</h2>
          <p className="text-gray-300 mt-2 text-lg">{profile.bio}</p>

          <div className="flex flex-col gap-2 mt-4 text-gray-300">
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="w-5 h-5 text-pinder-pink/80" />
              <span>{profile.occupation}</span>
            </div>
            <div className="flex items-center gap-2">
              <LocationIcon className="w-5 h-5 text-pinder-pink/80" />
              <span>{profile.location}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {profile.interests.map((interest) => (
              <span key={interest} className="bg-white/10 text-white text-sm font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                {interest}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-around items-center gap-4 mt-6">
          <button
            onClick={() => onPass(profile.id)}
            disabled={isProcessing}
            className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-lg border border-white/20 hover:bg-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110"
          >
            <CloseIcon className="w-8 h-8 text-red-400" />
          </button>
          <button
            onClick={() => onLike(profile.id)}
            disabled={isProcessing}
            className="w-24 h-24 rounded-full bg-pinder-pink flex items-center justify-center backdrop-blur-lg border border-pinder-pink/60 hover:bg-pinder-pink/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-wait transform hover:scale-110"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            ) : (
              <HeartIcon className="w-10 h-10 text-white" />
            )}
          </button>
          <button
            onClick={onToggleReactions}
            disabled={isProcessing}
            className="w-20 h-20 bg-linear-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center backdrop-blur-lg border border-purple-500/60 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110"
          >
            <span className="text-2xl">⚡</span>
          </button>
        </div>

        {showReactions && (
          <ReactionsPanel
            onReaction={(type) => onReaction(profile.id, type)}
            balance={balance}
            disabled={isProcessing}
          />
        )}
      </div>
    </div>
  );
}
