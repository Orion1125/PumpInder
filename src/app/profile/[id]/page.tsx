'use client';

import { AppHeader } from '@/components/AppHeader';
import Image from 'next/image';
import { Heart, MapPin, Briefcase } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useProfiles } from '@/hooks/useProfiles';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params?.id ? Number(params.id) : null;
  const { profiles } = useProfiles();

  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return (
      <div className="min-h-screen bg-(--bg-canvas) text-[#121212] flex flex-col items-center justify-center px-6">
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
    <div className="min-h-screen bg-(--bg-canvas) text-[#121212]">
      <AppHeader logoType="back" showBalance={false} showProfile={false} />

      <main className="main-content mx-auto max-w-4xl px-4 pb-12 pt-28 lg:px-8">
        <div className="rounded-none border-4 border-[#121212] bg-[#F4F4F0]/90 shadow-[12px_12px_0_#121212] p-8">
          {/* Profile Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              <div className="h-32 w-32 border-4 border-[#121212] bg-white shadow-[6px_6px_0_#121212]">
                <Image
                  src={profile.imageUrl}
                  alt={profile.name}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              </div>
              {profile.likesYou && (
                <div className="absolute -top-2 -right-2 rounded-none border-[3px] border-[#121212] bg-[#FF4D00] px-3 py-1">
                  <Heart className="h-5 w-5 text-white fill-white" />
                </div>
              )}
            </div>

            <h1 className="font-['Clash Display'] text-4xl uppercase tracking-[0.3em] mb-2">
              {profile.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#555] mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                <span>{profile.occupation}</span>
              </div>
              <div className="font-mono">
                {profile.age} years old
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-8">
            <h2 className="font-mono text-[0.8rem] uppercase tracking-[0.3em] text-[#555] mb-3">ABOUT</h2>
            <p className="font-mono text-sm leading-relaxed bg-white border-[3px] border-[#121212] p-4 shadow-[4px_4px_0_#121212]">
              {profile.bio}
            </p>
          </div>

          {/* Interests */}
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push(`/chat?match=${profile.id}`)}
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
