'use client';

import { useCallback, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { MatchNotification } from '@/components/MatchNotification';
import { ProfileCard } from '@/components/ProfileCard';
import { useProfiles } from '@/hooks/useProfiles';
import { UserProfile } from '@/types';

export default function SwipePage() {
  const { profiles } = useProfiles();
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [pinderBalance, setPinderBalance] = useState(100);
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const [animation, setAnimation] = useState<'left' | 'right' | 'up' | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);

  const advanceToNextProfile = useCallback(() => {
    setTimeout(() => {
      setCurrentProfileIndex((prev) => Math.min(prev + 1, profiles.length - 1));
      setAnimation(null);
      setIsProcessingLike(false);
    }, 500);
  }, [profiles.length]);

  const handlePass = useCallback(() => {
    if (isProcessingLike) return;
    setAnimation('left');
    advanceToNextProfile();
  }, [isProcessingLike, advanceToNextProfile]);

  const handleLike = useCallback(() => {
    if (isProcessingLike || pinderBalance < 1) return;

    setIsProcessingLike(true);
    setAnimation('right');

    setTimeout(() => {
      const likedProfile = profiles[currentProfileIndex];
      setPinderBalance((prev) => prev - 1);

      if (likedProfile.likesYou) {
        setMatchedProfile(likedProfile);
        setIsMatchModalOpen(true);
      }
      advanceToNextProfile();
    }, 1200);
  }, [currentProfileIndex, isProcessingLike, pinderBalance, profiles, advanceToNextProfile]);

  const handleSuperlike = useCallback(() => {
    if (isProcessingLike || pinderBalance < 5) return;

    setIsProcessingLike(true);
    setAnimation('up');

    setTimeout(() => {
      const likedProfile = profiles[currentProfileIndex];
      setPinderBalance((prev) => prev - 5);

      if (likedProfile.likesYou) {
        setMatchedProfile(likedProfile);
        setIsMatchModalOpen(true);
      }
      advanceToNextProfile();
    }, 1200);
  }, [currentProfileIndex, isProcessingLike, pinderBalance, profiles, advanceToNextProfile]);

  const closeMatchModal = useCallback(() => {
    setIsMatchModalOpen(false);
    setMatchedProfile(null);
  }, []);

  const currentProfile = useMemo(() => {
    return profiles[currentProfileIndex];
  }, [profiles, currentProfileIndex]);

  return (
    <div className="bg-pinder-dark min-h-screen flex flex-col text-white font-sans">
      <Header balance={pinderBalance} />

      <main className="grow w-full px-4 pb-10 pt-28 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:grid lg:grid-cols-[3fr_2fr] lg:items-stretch">
          <div className="relative flex h-[70vh] min-h-[520px] max-h-[820px] w-full items-center justify-center rounded-[32px] border border-white/5 bg-white/5 p-4 shadow-[0_30px_120px_-60px_rgba(148,0,211,0.9)]">
            <div className="h-full w-full max-w-[520px]">
              {currentProfile ? (
                <ProfileCard
                  key={currentProfile.id}
                  profile={currentProfile}
                  onLike={handleLike}
                  onPass={handlePass}
                  onSuperlike={handleSuperlike}
                  isProcessing={isProcessingLike}
                  animation={animation}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-[28px] border border-white/10 bg-pinder-dark/70 text-center animate-fade-in">
                  <h2 className="text-3xl font-bold">That&apos;s everyone for now!</h2>
                  <p className="text-white/70 mt-3">Check back later for new profiles.</p>
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col rounded-[32px] border border-white/5 bg-black/50 p-6 shadow-2xl shadow-pinder-purple/20 backdrop-blur-xl">
            <div className="flex-1 space-y-8">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Desk telemetry</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm uppercase tracking-[0.35em] text-white/50">Balance (demo)</p>
                    <p className="mt-2 text-3xl font-bold">{pinderBalance}</p>
                    <p className="text-xs text-white/50">$PINDER credits</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm uppercase tracking-[0.35em] text-white/50">Queue <br/>(demo)</p>
                    <p className="mt-2 text-3xl font-bold">{profiles.length - currentProfileIndex}</p>
                    <p className="text-xs text-white/50">Profiles remaining</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Control room</p>
                <div className="mt-4 grid gap-4">
                  {[
                    { title: 'SWIPE RIGHT', description: 'Like profile' },
                    { title: 'SWIPE LEFT', description: 'Pass profile' },
                    { title: 'ESC', description: 'Dismiss match modal' },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <span className="font-mono text-sm tracking-[0.3em] text-white/70">{item.title}</span>
                      <span className="text-white/90 text-sm">{item.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Testing mode</p>
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-pinder-pink" />
                    Wallet connections are disabled for this preview build.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-pinder-pink" />
                    Likes and consume demo credits only.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-pinder-pink" />
                    Profiles auto-refresh every 3 hours.
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <MatchNotification
        isOpen={isMatchModalOpen}
        onClose={closeMatchModal}
        currentUserImageUrl="https://picsum.photos/seed/user/200"
        matchedProfile={matchedProfile}
      />
    </div>
  );
}
