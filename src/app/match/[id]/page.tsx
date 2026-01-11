'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function MatchChatPage() {
  const params = useParams();
  const matchId = params?.id;

  return (
    <div className="min-h-screen bg-pinder-dark text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-2xl space-y-6">
        <p className="text-sm uppercase tracking-[0.4em] text-pinder-pink">Chat coming soon</p>
        <h1 className="text-4xl font-black">Match #{matchId}</h1>
        <p className="text-white/70 text-lg">
          This route will unlock once both users like each other and we write messages to Supabase. Expect a minimal text chat
          experience with wallet identity.
        </p>
        <Link
          href="/swipe"
          className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3 font-semibold text-white/80 transition hover:border-pinder-pink/60 hover:text-white"
        >
          Back to matches
        </Link>
      </div>
    </div>
  );
}
