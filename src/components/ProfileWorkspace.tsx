'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEYS = {
  profile: 'pinder_profile',
  hasProfile: 'pinder_has_profile',
} as const;

type ProfileFormState = {
  name: string;
  age: string;
  location: string;
  occupation: string;
  bio: string;
  imageUrl: string;
  interests: string;
};

const defaultForm: ProfileFormState = {
  name: '',
  age: '',
  location: '',
  occupation: '',
  bio: '',
  imageUrl: '',
  interests: '',
};

interface ProfileWorkspaceProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  submitLabel: string;
  footnote: string;
  successRedirect?: string;
  backHref?: string;
  backLabel?: string;
  onSubmit?: () => boolean | void;
}

export function ProfileWorkspace({
  eyebrow,
  title,
  subtitle,
  submitLabel,
  footnote,
  successRedirect = '/swipe',
  backHref,
  backLabel = 'Back',
  onSubmit,
}: ProfileWorkspaceProps) {
  const router = useRouter();

  const [form, setForm] = useState<ProfileFormState>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedProfile = localStorage.getItem(STORAGE_KEYS.profile);
    if (!storedProfile) return;
    try {
      const parsed = JSON.parse(storedProfile);
      setForm({
        name: parsed.name ?? '',
        age: parsed.age ? String(parsed.age) : '',
        location: parsed.location ?? '',
        occupation: parsed.occupation ?? '',
        bio: parsed.bio ?? '',
        imageUrl: parsed.imageUrl ?? '',
        interests: Array.isArray(parsed.interests) ? parsed.interests.join(', ') : parsed.interests ?? '',
      });
    } catch (err) {
      console.warn('Failed to parse stored profile', err);
    }
  }, []);

  const interestTags = useMemo(() => {
    return form.interests
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }, [form.interests]);

  const handleInputChange = (field: keyof ProfileFormState) => (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    setForm((prev) => ({ ...prev, [field]: target.value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Call onSubmit if provided and check if it returns false to prevent submission
    if (onSubmit) {
      const result = onSubmit();
      if (result === false) {
        return; // Prevent form submission
      }
    }

    if (!form.name.trim() || !form.bio.trim()) {
      setError('Name and bio are required.');
      return;
    }

    const numericAge = Number(form.age);
    if (form.age && (Number.isNaN(numericAge) || numericAge < 18)) {
      setError('Enter a valid age (18+).');
      return;
    }

    const profilePayload = {
      name: form.name.trim(),
      age: numericAge || 0,
      location: form.location.trim(),
      occupation: form.occupation.trim(),
      bio: form.bio.trim(),
      imageUrl:
        form.imageUrl.trim() || `https://picsum.photos/seed/${encodeURIComponent(form.name.trim() || 'pinder')}/800/1200`,
      interests: interestTags,
      likesYou: false,
    };

    try {
      setIsSaving(true);
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profilePayload));
      localStorage.setItem(STORAGE_KEYS.hasProfile, 'true');
      router.push(successRedirect);
    } catch (err) {
      console.error('Failed to save profile', err);
      setError('Unable to save profile locally. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isBusy = isSaving;

  return (
    <div className="min-h-screen bg-pinder-dark px-6 py-10 text-white md:py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 md:gap-14">
        {backHref && (
          <div>
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 transition hover:border-pinder-pink/60 hover:text-white"
            >
              ← {backLabel}
            </Link>
          </div>
        )}
        <div className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.45em] text-pinder-pink">{eyebrow}</p>
          <h1 className="text-4xl font-black sm:text-5xl">{title}</h1>
          <p className="mx-auto max-w-3xl text-white/70">{subtitle}</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start xl:gap-16">
          <form
            onSubmit={handleSubmit}
            className="space-y-10 rounded-3xl border border-white/10 bg-black/40 p-8 shadow-lg shadow-pinder-purple/10 md:p-10"
          >
            <div className="grid gap-6 md:grid-cols-2 md:gap-10">
              <label className="space-y-3.5 text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                Display name
                <input
                  type="text"
                  value={form.name}
                  onChange={handleInputChange('name')}
                  placeholder="e.g. Celeste"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder-white/30 focus:border-pinder-pink focus:outline-none"
                  required
                />
              </label>
              <label className="space-y-3.5 text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                Age
                <input
                  type="number"
                  min={18}
                  value={form.age}
                  onChange={handleInputChange('age')}
                  placeholder="24"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder-white/30 focus:border-pinder-pink focus:outline-none"
                />
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2 md:gap-10">
              <label className="space-y-3.5 text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                Location
                <input
                  type="text"
                  value={form.location}
                  onChange={handleInputChange('location')}
                  placeholder="Lisbon, PT"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder-white/30 focus:border-pinder-pink focus:outline-none"
                />
              </label>
              <label className="space-y-3.5 text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                Occupation
                <input
                  type="text"
                  value={form.occupation}
                  onChange={handleInputChange('occupation')}
                  placeholder="DAO contributor"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder-white/30 focus:border-pinder-pink focus:outline-none"
                />
              </label>
            </div>

            <label className="space-y-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
              Bio
              <textarea
                value={form.bio}
                onChange={handleInputChange('bio')}
                placeholder="NFT artist &amp; sunrise chaser. Looking for someone bullish on life."
                className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder-white/30 focus:border-pinder-pink focus:outline-none"
                required
              />
            </label>

            <label className="space-y-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
              Primary photo URL
              <input
                type="url"
                value={form.imageUrl}
                onChange={handleInputChange('imageUrl')}
                placeholder="https://..."
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder-white/30 focus:border-pinder-pink focus:outline-none"
              />
            </label>

            <label className="space-y-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
              Interests (comma separated)
              <input
                type="text"
                value={form.interests}
                onChange={handleInputChange('interests')}
                placeholder="DeFi, Hiking, Memecoins"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder-white/30 focus:border-pinder-pink focus:outline-none"
              />
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex flex-col gap-6 pt-10 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Local save only (testing mode)</p>
              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex items-center justify-center rounded-full bg-pinder-pink px-8 py-3 text-base font-semibold text-white shadow-lg shadow-pinder-purple/20 transition hover:bg-pinder-pink/90 disabled:opacity-60"
              >
                {isBusy ? 'Saving profile...' : submitLabel}
              </button>
            </div>
          </form>

          <div className="space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.45em] text-white/60">Preview</p>
            <div className="rounded-3xl border border-white/10 bg-black/30 p-4 md:p-5">
              <div
                className="relative h-72 w-full overflow-hidden rounded-2xl border border-white/10"
                style={{
                  backgroundImage:
                    form.imageUrl
                      ? `linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 90%), url(${form.imageUrl})`
                      : 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 90%), url(https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=800&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <p className="text-2xl font-black">
                    {form.name || 'Anon Degen'} {form.age && <span className="text-white/70">· {form.age}</span>}
                  </p>
                  <p className="text-white/70 text-sm">{form.location || 'Somewhere on-chain'}</p>
                </div>
              </div>
              <div className="space-y-4 pt-6">
                <p className="text-sm text-white/80">{form.bio || 'This is where your spicy intro goes.'}</p>
                <div className="flex flex-wrap gap-2">
                  {interestTags.length > 0 ? (
                    interestTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/40">DeFi, NFTs, Memes</span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-white/60">{footnote}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
