'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';

export default function MatchChatPage() {
  const params = useParams();
  const matchId = params?.id;

  return (
    <div className="min-h-screen text-(--ink-primary)">
      <AppHeader logoType="back" showBalance={false} showProfile={false} showNav={false} />
      
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm uppercase tracking-[0.4em] text-pinder-pink">Chat coming soon</p>
          <h1 className="text-4xl font-black">Match #{matchId}</h1>
          <p className="text-[#4A4A4A] text-lg">
            This route will unlock once both users like each other. Expect a minimal text chat
            experience with wallet identity.
          </p>
          <Link
            href="/swipe"
            className="inline-flex items-center justify-center rounded-full border-2 border-[#121212] px-8 py-3 font-semibold text-[#121212] transition hover:bg-[#121212] hover:text-white"
          >
            Back to matches
          </Link>
        </div>
      </div>
    </div>
  );
}
