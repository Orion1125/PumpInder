'use client';

import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';

const metrics = [
  { label: 'PINDER spent today', value: '1,420' },
  { label: 'New signups', value: '212' },
  { label: 'Boosts running', value: '38' },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-(--bg-canvas) text-[#121212]">
      <AppHeader logoType="pumpinder" showBalance={false} showProfile={false} showNav={false} />
      
      <div className="mx-auto max-w-4xl space-y-10 px-6 py-16">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-pinder-pink">Dashboard preview</p>
          <h1 className="mt-2 text-4xl font-black">Admin Control Room</h1>
          <p className="text-white/70 text-lg mt-4">
            This placeholder will become the real-time dashboard showing treasury flow, signups, and active users once we
            wire Supabase + RPC data.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <p className="text-3xl font-black">{metric.value}</p>
              <p className="text-sm text-white/60">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Coming soon</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-white/70">
            <li>Supabase queries for profiles, swipes, matches, and messages.</li>
            <li>On-chain treasury balance via Solana RPC.</li>
            <li>Boost analytics with token spend breakdowns.</li>
          </ul>
        </div>

        <Link
          href="/swipe"
          className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3 font-semibold text-white/80 transition hover:border-pinder-pink/60 hover:text-white"
        >
          Back to Swipe Mode
        </Link>
      </div>
    </div>
  );
}
