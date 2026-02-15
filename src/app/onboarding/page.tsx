'use client';

import { useState, useMemo, useCallback, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, Palette, Gamepad2, BarChart3, Smile, Wrench,
  Music, CameraIcon, Book, Dumbbell, Plane, TreePine, Coffee, Pizza, Film, PenTool,
  Zap, Star, Cat, Dog, Bird, Fish, Flower, Cloud, Sun, Moon, Globe, Heart, Wallet
} from 'lucide-react';

const allowedCharacters = /[^A-Z0-9_]/g;

const steps = ['wallet', 'handle', 'birthday', 'gender', 'interests', 'photos'] as const;
type StepId = typeof steps[number];

const genderOptions = ['FEMALE', 'MALE', 'NON-BINARY', 'PREFER NOT TO SAY'];

const interestOptions = [
  { id: 'defi', label: 'DEFI', icon: TrendingUp },
  { id: 'nfts', label: 'NFTS', icon: Palette },
  { id: 'gaming', label: 'GAMING', icon: Gamepad2 },
  { id: 'trading', label: 'TRADING', icon: BarChart3 },
  { id: 'memes', label: 'MEMES', icon: Smile },
  { id: 'builders', label: 'BUILDERS', icon: Wrench },
  { id: 'music', label: 'MUSIC', icon: Music },
  { id: 'photography', label: 'PHOTOGRAPHY', icon: CameraIcon },
  { id: 'reading', label: 'READING', icon: Book },
  { id: 'fitness', label: 'FITNESS', icon: Dumbbell },
  { id: 'travel', label: 'TRAVEL', icon: Plane },
  { id: 'nature', label: 'NATURE', icon: TreePine },
  { id: 'coffee', label: 'COFFEE', icon: Coffee },
  { id: 'food', label: 'FOOD', icon: Pizza },
  { id: 'movies', label: 'MOVIES', icon: Film },
  { id: 'art', label: 'ART', icon: PenTool },
  { id: 'writing', label: 'WRITING', icon: PenTool },
  { id: 'science', label: 'SCIENCE', icon: Zap },
  { id: 'space', label: 'SPACE', icon: Star },
  { id: 'animals', label: 'ANIMALS', icon: Cat },
  { id: 'dogs', label: 'DOGS', icon: Dog },
  { id: 'cats', label: 'CATS', icon: Cat },
  { id: 'birds', label: 'BIRDS', icon: Bird },
  { id: 'fish', label: 'FISH', icon: Fish },
  { id: 'gardening', label: 'GARDENING', icon: Flower },
  { id: 'weather', label: 'WEATHER', icon: Cloud },
  { id: 'outdoors', label: 'OUTDOORS', icon: Sun },
  { id: 'nightlife', label: 'NIGHTLIFE', icon: Moon },
  { id: 'relationships', label: 'RELATIONSHIPS', icon: Heart },
  { id: 'global', label: 'GLOBAL', icon: Globe },
];

type OnboardingState = {
  handle: string;
  birthday: string;
  gender: string;
  interests: string[];
  photos: string[];
};

const defaultState: OnboardingState = {
  handle: '',
  birthday: '',
  gender: '',
  interests: [],
  photos: Array(5).fill(''),
};

export default function OnboardingPage() {
  const router = useRouter();
  const { isConnected, publicKey, connectWallet, error: walletError } = useWallet();
  const { refreshProfile, hasCompletedProfile, isLoading: isAuthLoading } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [form, setForm] = useState<OnboardingState>(defaultState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && hasCompletedProfile) {
      router.replace('/swipe');
    }
  }, [hasCompletedProfile, isAuthLoading, router]);

  const progressBlocks = useMemo(() => {
    return Array.from({ length: steps.length }).map((_, index) => (
      <span
        key={`progress-${index}`}
        className={`progress-block ${index <= currentStepIndex ? 'progress-block--filled' : ''}`}
      />
    ));
  }, [currentStepIndex]);

  const isCurrentStepValid = useMemo(() => {
    const currentStep = steps[currentStepIndex];
    switch (currentStep) {
      case 'wallet':
        return isConnected && !!publicKey;
      case 'handle':
        return form.handle.replace(allowedCharacters, '').length >= 3;
      case 'birthday':
        return Boolean(form.birthday);
      case 'gender':
        return Boolean(form.gender);
      case 'interests':
        return form.interests.length > 0;
      case 'photos':
        return Boolean(form.photos[0]);
      default:
        return false;
    }
  }, [currentStepIndex, form, isConnected, publicKey]);

  const formatHandle = useCallback((value: string) => {
    return value.toUpperCase().replace(allowedCharacters, '');
  }, []);

  const handleNextStep = useCallback(() => {
    if (!isCurrentStepValid) return;
    if (currentStepIndex >= steps.length - 1) return;
    setCurrentStepIndex((prev) => prev + 1);
  }, [currentStepIndex, isCurrentStepValid]);

  const handlePreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const handleBackToHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // On last step, create profile
    if (currentStepIndex === steps.length - 1 && isCurrentStepValid) {
      handleCreateProfile();
      return;
    }
    handleNextStep();
  };

  const handlePhotoUpload = (index: number, fileList: FileList | null) => {
    if (!fileList || !fileList[0]) return;
    const file = fileList[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setForm((prev) => {
        const updated = [...prev.photos];
        updated[index] = result;
        return { ...prev, photos: updated };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index: number) => {
    setForm((prev) => {
      const updated = [...prev.photos];
      updated[index] = '';
      return { ...prev, photos: updated };
    });
  };

  const updateField = (field: StepId, value: string) => {
    if (field === 'handle') {
      setForm((prev) => ({ ...prev, handle: formatHandle(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interestId: string) => {
    setForm((prev) => {
      const alreadySelected = prev.interests.includes(interestId);
      if (alreadySelected) {
        return { ...prev, interests: prev.interests.filter((item) => item !== interestId) };
      }
      if (prev.interests.length < 4) {
        return { ...prev, interests: [...prev.interests, interestId] };
      }
      return prev;
    });
  };

  const handleCreateProfile = useCallback(async () => {
    if (!publicKey || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletPublicKey: publicKey,
          handle: form.handle,
          birthday: form.birthday,
          gender: form.gender,
          interests: form.interests,
          photos: form.photos.filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create profile');
      }

      // Refresh auth context so it knows profile is complete
      await refreshProfile();
      router.push('/swipe');
    } catch (error) {
      console.error('Error creating profile:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  }, [publicKey, isSubmitting, form, refreshProfile, router]);

  const currentStep = steps[currentStepIndex];
  const isWalletStep = currentStep === 'wallet';
  const isLastStep = currentStepIndex === steps.length - 1;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'wallet':
        return (
          <>
            <div className="mt-8 space-y-4">
              <h1 className="display-font text-5xl leading-tight tracking-widest">CONNECT YOUR WALLET</h1>
              <p className="ui-font text-sm italic text-ink-secondary whitespace-pre-line">
                {'// CONNECT YOUR PHANTOM WALLET TO GET STARTED.'}
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center gap-6">
              {isConnected && publicKey ? (
                <div className="w-full px-4 py-4 border-2 border-green-600 bg-green-50 text-green-800">
                  <p className="ui-font text-sm font-bold">WALLET CONNECTED</p>
                  <p className="ui-font text-xs mt-1 font-mono break-all">{publicKey}</p>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-block flex items-center justify-center gap-3"
                  onClick={() => {
                    void connectWallet();
                  }}
                >
                  <Wallet size={20} />
                  CONNECT PHANTOM WALLET
                </button>
              )}
              {walletError && (
                <p className="ui-font text-xs text-red-700 text-center">{walletError}</p>
              )}
              <p className="ui-font text-xs text-ink-secondary text-center">
                New to Phantom? A new wallet address will become your Mypinder account ID.
              </p>
            </div>
          </>
        );
      case 'handle':
        return (
          <>
            <div className="mt-8 space-y-4">
              <h1 className="display-font text-5xl leading-tight tracking-widest">MINT YOUR HANDLE</h1>
              <p className="ui-font text-sm italic text-ink-secondary whitespace-pre-line">
                {'// CREATE YOUR USERNAME.'}
              </p>
            </div>

            <input
              type="text"
              value={form.handle}
              onChange={(e) => updateField('handle', e.target.value)}
              placeholder="ENTER YOUR NAME"
              className="w-full mt-8 px-4 py-3 border-2 border-black bg-white text-black placeholder-gray-500 focus:outline-none focus:border-black ui-font"
              maxLength={20}
            />
          </>
        );
      case 'birthday':
        return (
          <>
            <div className="mt-8 space-y-4">
              <h1 className="display-font text-5xl leading-tight tracking-widest">DROP YOUR BIRTHDAY</h1>
              <p className="ui-font text-sm italic text-ink-secondary whitespace-pre-line">
                {'// WE KEEP THIS BETWEEN US.'}
              </p>
            </div>

            <input
              type="date"
              value={form.birthday}
              onChange={(e) => updateField('birthday', e.target.value)}
              className="w-full mt-8 px-4 py-3 border-2 border-black bg-white text-black placeholder-gray-500 focus:outline-none focus:border-black ui-font"
            />
          </>
        );
      case 'gender':
        return (
          <>
            <div className="mt-8 space-y-4">
              <h1 className="display-font text-5xl leading-tight tracking-widest">SELECT YOUR ENERGY</h1>
              <p className="ui-font text-sm italic text-ink-secondary whitespace-pre-line">
                {'// TAP WHAT FITS. FLEX LATER IF NEEDED.'}
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {genderOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`option-tile ${form.gender === option ? 'option-tile--active' : ''}`}
                  onClick={() => updateField('gender', option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        );
      case 'interests':
        return (
          <>
            <div className="mt-8 space-y-4">
              <h1 className="display-font text-5xl leading-tight tracking-widest">CHOOSE YOUR SIGNALS</h1>
              <p className="ui-font text-sm italic text-ink-secondary whitespace-pre-line">
                {'// MULTI-SELECT YOUR VIBES.'}
              </p>
              <p className="ui-font text-xs text-ink-secondary">
                {form.interests.length}/4 INTERESTS SELECTED
              </p>
            </div>

            <div className="interests-grid mt-6">
              {interestOptions.map((interest) => (
                <button
                  type="button"
                  key={interest.id}
                  className={`option-tile option-tile--compact ${
                    form.interests.includes(interest.id) ? 'option-tile--active' : ''
                  } ${
                    form.interests.length >= 4 && !form.interests.includes(interest.id) ? 'option-tile--disabled' : ''
                  }`}
                  onClick={() => toggleInterest(interest.id)}
                  disabled={form.interests.length >= 4 && !form.interests.includes(interest.id)}
                >
                  <span className="option-icon" aria-hidden="true"><interest.icon size={20} /></span>
                  {interest.label}
                </button>
              ))}
            </div>
          </>
        );
      case 'photos':
        return (
          <>
            <div className="mt-8 space-y-3">
              <h1 className="display-font text-5xl leading-tight tracking-widest">UPLOAD YOUR LOOK</h1>
              <p className="ui-font text-sm italic text-ink-secondary whitespace-pre-line">
                {'// SLOT 01 IS YOUR DISPLAY PIC. OTHERS SHOW ON YOUR PUBLIC PROFILE.'}
              </p>
              <p className="ui-font text-xs text-ink-secondary">{form.photos.filter(Boolean).length}/5 PHOTOS ADDED</p>
            </div>

            <div className="photo-grid mt-8">
              {form.photos.map((photo, index) => {
                const label = index === 0 ? 'DISPLAY PICTURE' : `PROFILE SLOT ${index + 1}`;
                return (
                  <div key={`photo-${index}`} className={`photo-slot ${photo ? 'photo-slot--filled' : ''} ${index === 0 ? 'photo-slot--primary' : ''}`}>
                    <label className="photo-label-wrapper">
                      <input
                        type="file"
                        accept="image/*"
                        className="photo-input"
                        onChange={(event) => handlePhotoUpload(index, event.target.files)}
                      />
                      {photo ? (
                        <Image src={photo} alt={label} className="photo-preview" width={200} height={200} />
                      ) : (
                        <div className="photo-placeholder">
                          <span className="photo-label">{label}</span>
                          <span className="photo-hint">CLICK TO UPLOAD</span>
                        </div>
                      )}
                    </label>
                    {photo && (
                      <button
                        type="button"
                        className="photo-remove"
                        onClick={() => handleRemovePhoto(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {submitError && (
              <div className="mt-4 px-4 py-3 border-2 border-red-500 bg-red-50 text-red-700 text-sm">
                {submitError}
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <header className="absolute top-10 left-10 z-30">
        <button 
          onClick={handleBackToHome}
          className="display-font text-2xl tracking-[0.2em] hover:opacity-80 transition-opacity duration-200"
          style={{ textTransform: 'uppercase' }}
        >
          MYPINDER™
        </button>
      </header>

      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <form className="onboarding-card" onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-4">
            <button
              type="button"
              className="ui-font text-sm text-ink-secondary hover:text-[#5D5FEF] hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              onClick={isWalletStep ? handleBackToHome : handlePreviousStep}
              disabled={!isWalletStep && currentStepIndex === 0}
            >
              {isWalletStep ? "< BACK TO HOME" : "< PREVIOUS"}
            </button>
            <div className="flex gap-2">
              {progressBlocks}
            </div>
          </div>

          {renderStepContent()}

          {currentStep !== 'wallet' && (
            <button
              type="submit"
              className="btn-block" 
              style={{ marginTop: '3rem' }}
              disabled={!isCurrentStepValid || isSubmitting}
            >
              {isSubmitting ? 'CREATING PROFILE...' : isLastStep ? 'CREATE PROFILE' : 'NEXT'}
            </button>
          )}

          {currentStep === 'wallet' && isConnected && publicKey && (
            <button
              type="button"
              className="btn-block" 
              style={{ marginTop: '3rem' }}
              onClick={handleNextStep}
            >
              CONTINUE
            </button>
          )}
        </form>
      </main>

      <div className="fixed bottom-8 right-8 z-20">
        <button
          onClick={() => router.push('/swipe')}
          className="ui-font text-xs text-ink-secondary hover:text-[#5D5FEF] hover:scale-105 transition-all duration-200 bg-white border-2 border-black px-3 py-2 shadow-hard"
        >
          HAVE AN ACCOUNT? CONTINUE SWIPING
        </button>
      </div>
    </div>
  );
}
