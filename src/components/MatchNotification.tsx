'use client';

import Image from 'next/image';
import Link from 'next/link';
import { UserProfile } from '@/types';
import { HeartIcon } from './Icons';

interface MatchNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserImageUrl: string;
  matchedProfile: UserProfile | null;
}

export function MatchNotification({ isOpen, onClose, currentUserImageUrl, matchedProfile }: MatchNotificationProps) {
  if (!isOpen || !matchedProfile) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-overlay-in"
      onClick={onClose}
    >
      <div
        className="border border-white/10 bg-black/70 rounded-2xl p-8 text-center animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-5xl font-black text-white mb-4">
          It&apos;s a Match!
        </h2>
        <p className="text-gray-300 text-lg mb-6">You and {matchedProfile.handle} have liked each other.</p>
        <p className="text-sm text-white/70 mb-8">
          Slide into chat to plan your first move or keep scouting the desk—it&apos;s your call.
        </p>
        <div className="-space-x-8 flex items-center justify-center mb-8">
          <Image
            src={currentUserImageUrl}
            alt="You"
            width={128}
            height={128}
            className="rounded-full object-cover border-4 border-pinder-purple shadow-lg"
          />
          <div className="w-16 h-16 rounded-full bg-pinder-pink flex items-center justify-center z-10 border-4 border-pinder-dark">
            <HeartIcon className="w-8 h-8 text-white" />
          </div>
          <Image
            src={matchedProfile.photos?.[0] || '/placeholder.png'}
            alt={matchedProfile.handle}
            width={128}
            height={128}
            className="rounded-full object-cover border-4 border-pinder-pink shadow-lg"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/chat?match=${matchedProfile.id}`}
            className="flex-1 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-pinder-pink/60 hover:text-white"
          >
            Chat
          </Link>
          <button
            onClick={onClose}
            className="flex-1 rounded-full bg-pinder-pink px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-pinder-pink/90"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
}
