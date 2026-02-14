'use client';

import { AppHeader } from '@/components/AppHeader';
import Image from 'next/image';
import { MapPin, Briefcase } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProfileData {
  id: string;
  walletPublicKey: string;
  handle: string;
  birthday: string;
  gender: string;
  interests: string[];
  photos: string[];
  bio?: string;
  location?: string;
  occupation?: string;
}

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

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const walletId = params?.id as string;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!walletId) return;

    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/profiles/${walletId}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [walletId]);

  if (isLoading) {
    return (
      <div className="min-h-screen text-(--ink-primary) flex flex-col items-center justify-center px-6">
        <p className="ui-font text-sm text-ink-secondary uppercase tracking-widest">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen text-(--ink-primary) flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-['Clash Display'] text-3xl uppercase tracking-[0.3em] mb-4">Profile Not Found</h1>
          <button
            onClick={() => router.back()}
            className="border-[3px] border-[#121212] bg-white px-4 py-2 font-bold text-[#121212] shadow-[4px_4px_0_#121212] transition hover:-translate-y-0.5"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-(--ink-primary)">
      <AppHeader logoType="back" showBalance={false} showProfile={false} />

      <main className="main-content mx-auto max-w-4xl px-4 pb-12 pt-28 lg:px-8">
        <div className="rounded-none border-4 border-[#121212] bg-[#F4F4F0]/90 shadow-[12px_12px_0_#121212] p-8">
          {/* Profile Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              <div className="h-32 w-32 border-4 border-[#121212] bg-white shadow-[6px_6px_0_#121212]">
                {profile.photos?.[0] && (
                  <Image
                    src={profile.photos[0]}
                    alt={profile.handle}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>

            <h1 className="font-['Clash Display'] text-4xl uppercase tracking-[0.3em] mb-2">
              {profile.handle}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#555] mb-4">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.occupation && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>{profile.occupation}</span>
                </div>
              )}
              {profile.birthday && (
                <div className="font-mono">
                  {getAge(profile.birthday)} years old
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mb-8">
              <h2 className="font-mono text-[0.8rem] uppercase tracking-[0.3em] text-[#555] mb-3">ABOUT</h2>
              <p className="font-mono text-sm leading-relaxed bg-white border-[3px] border-[#121212] p-4 shadow-[4px_4px_0_#121212]">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Interests */}
          {profile.interests?.length > 0 && (
            <div className="mb-8">
              <h2 className="font-mono text-[0.8rem] uppercase tracking-[0.3em] text-[#555] mb-3">INTERESTS</h2>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="border-[3px] border-[#121212] bg-white px-3 py-1 font-mono text-xs uppercase shadow-[4px_4px_0_#121212]"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push(`/chat?thread=${profile.walletPublicKey}`)}
              className="flex-1 border-[3px] border-[#121212] bg-[#5D5FEF] text-white px-6 py-3 font-bold uppercase tracking-[0.3em] shadow-[4px_4px_0_#121212] transition hover:bg-[#4A4BC8] hover:-translate-y-0.5"
            >
              Send Message
            </button>
            <button
              onClick={() => router.push('/swipe')}
              className="flex-1 border-[3px] border-[#121212] bg-white text-[#121212] px-6 py-3 font-bold uppercase tracking-[0.3em] shadow-[4px_4px_0_#121212] transition hover:bg-[#121212] hover:text-white hover:-translate-y-0.5"
            >
              Back to Swipe
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
