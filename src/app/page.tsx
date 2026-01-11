'use client';

import { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const stats = [
  { label: 'PINDER spent', value: '47,820' },
  { label: 'Matches sparked', value: '6,201' },
  { label: 'Active wallets', value: '12,409' },
];

const PROFILE_FLAG = 'pinder_has_profile';

export default function Home() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const startExperience = useCallback(() => {
    startTransition(() => {
      const hasProfile = typeof window !== 'undefined' && localStorage.getItem(PROFILE_FLAG) === 'true';
      router.push(hasProfile ? '/swipe' : '/onboarding');
    });
  }, [router, startTransition]);

  const busy = isPending;

  return (
    <div className="relative min-h-screen overflow-hidden bg-pinder-dark text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-pinder-pink blur-[140px]" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-pinder-purple blur-[160px]" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-12 px-6 py-16 text-center">
        <section className="w-full max-w-3xl space-y-8">
          <p className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-pinder-pink">
            ❤️🔥 Pumpfun-native swipes
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">
              Prove your on-chain crush with $PINDER.
            </h1>
            <p className="mx-auto max-w-2xl text-base text-white/70 sm:text-lg">
              Every like, superlike, and boost pulls from your wallet. Serious signals only—connect, mint your profile, and dive
              into Solana&apos;s spiciest dating pool.
            </p>
          </div>
          <div className="mx-auto max-w-md space-y-3">
            <button
              type="button"
              onClick={startExperience}
              disabled={busy}
              className="inline-flex w-full items-center justify-center rounded-full bg-pinder-pink px-8 py-4 text-lg font-bold text-white shadow-lg shadow-pinder-purple/30 transition hover:bg-pinder-pink/90 disabled:opacity-70"
            >
              {busy ? 'Preparing desk...' : 'Enter PumpInder'}
            </button>
            <p className="text-sm text-white/60">
              We&apos;ll send first-time visitors through onboarding and return others to swipe mode instantly.
            </p>
          </div>
        </section>

        <section className="w-full max-w-4xl space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="grid gap-6 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-pinder-pink/30 bg-black/40 p-5 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-pinder-pink">Why PumpInder?</p>
            <p className="mt-3 text-white/80">
              Wallet-native trust, SPL-powered intent, and instant treasury kickbacks keep the vibes curated and the energy high.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
