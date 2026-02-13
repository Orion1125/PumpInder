'use client';

import { useState, useEffect, useMemo, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useWallet, WalletInfo } from '@/hooks/useWallet';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { hasPhraseBackup, encryptPhrase, storePhraseBackup } from '@/utils/phraseVault';
import { generateMnemonic } from 'bip39';
import { 
  TrendingUp, Palette, Gamepad2, BarChart3, Smile, Wrench,
  Music, CameraIcon, Book, Dumbbell, Plane, TreePine, Coffee, Pizza, Film, PenTool,
  Zap, Star, Cat, Dog, Bird, Fish, Flower, Cloud, Sun, Moon, Globe, Twitter, Heart
} from 'lucide-react';

const HANDLE_STORAGE_KEY = 'pinder_handle';
const ONBOARDING_STORAGE_KEY = 'pinder_onboarding_payload';

const allowedCharacters = /[^A-Z0-9_]/g;

const steps = ['handle', 'birthday', 'gender', 'interests', 'photos', 'recovery'] as const;
type StepId = typeof steps[number];

const genderOptions = ['FEMALE', 'MALE', 'NON-BINARY', 'PREFER NOT TO SAY'];

const interestOptions = [
  // Crypto interests
  { id: 'defi', label: 'DEFI', icon: TrendingUp },
  { id: 'nfts', label: 'NFTS', icon: Palette },
  { id: 'gaming', label: 'GAMING', icon: Gamepad2 },
  { id: 'trading', label: 'TRADING', icon: BarChart3 },
  { id: 'memes', label: 'MEMES', icon: Smile },
  { id: 'builders', label: 'BUILDERS', icon: Wrench },
  
  // Non-crypto interests
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

type RecoveryProvider = 'x' | 'google';
type RecoveryAction = RecoveryProvider | 'skip';

type RecoveryOption = {
  id: RecoveryProvider;
  label: string;
  description: string;
};

const recoveryOptions: RecoveryOption[] = [
  {
    id: 'x',
    label: 'Link X (Twitter)',
    description: 'One-tap back in with your X handle whenever you log out.',
  },
  {
    id: 'google',
    label: 'Link Google (Gmail)',
    description: 'Use Gmail to re-enter securely from any device.',
  },
];

function GoogleGIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" role="presentation">
      <path
        fill="#4285F4"
        d="M21.35 11.1H12v3.78h5.35c-.24 1.18-1.4 3.47-5.35 3.47-3.23 0-5.85-2.65-5.85-5.9s2.62-5.9 5.85-5.9c1.85 0 3.09.79 3.8 1.45l2.59-2.49C16.57 3.75 14.46 2.9 12 2.9 6.98 2.9 2.9 6.98 2.9 12s4.08 9.1 9.1 9.1c5.21 0 8.63-3.65 8.63-8.78 0-.5-.09-1.07-.28-1.22Z"
      />
      <path fill="#34A853" d="M12 22c2.43 0 4.48-.8 5.97-2.17l-2.83-2.19c-.79.55-1.8.89-3.14.89-2.41 0-4.45-1.62-5.18-3.8H3.9v2.39C5.39 19.92 8.43 22 12 22Z" />
      <path fill="#FBBC05" d="M6.82 14.73c-.19-.59-.3-1.21-.3-1.86 0-.65.11-1.27.3-1.86V8.62H3.9A9.09 9.09 0 0 0 3 12c0 1.18.21 2.31.9 3.38z" />
      <path fill="#EA4335" d="M12 7.37c1.32 0 2.35.45 3.07 1.04l2.3-2.24C16.47 4.96 14.43 4 12 4 8.43 4 5.39 6.08 3.9 9.27l2.92 2.34C7.55 8.99 9.59 7.37 12 7.37Z" />
    </svg>
  );
}

type OnboardingState = {
  handle: string;
  birthday: string;
  gender: string;
  interests: string[];
  photos: string[];
  recoveryMethod: '' | RecoveryProvider;
};

const defaultState: OnboardingState = {
  handle: '',
  birthday: '',
  gender: '',
  interests: [],
  photos: Array(5).fill(''),
  recoveryMethod: '',
};

export default function OnboardingPage() {
  const router = useRouter();
  const { createWallet, saveWallet } = useWallet();
  
  // Use social auth - it will handle temporary wallet generation internally
  const { connectTwitter, connectGmail, connectTwitterMock, connectGmailMock } = useSocialAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [form, setForm] = useState<OnboardingState>(defaultState);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);
  const [hasCopiedPhrase, setHasCopiedPhrase] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupPasswordConfirm, setBackupPasswordConfirm] = useState('');
  const [backupError, setBackupError] = useState('');
  const [backupStatus, setBackupStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasStoredBackup, setHasStoredBackup] = useState(false);
  const [isConnectingSocial, setIsConnectingSocial] = useState<'x' | 'google' | null>(null);
  const [lastSocialProviderTried, setLastSocialProviderTried] = useState<'x' | 'google' | null>(null);
  const [socialConnectionError, setSocialConnectionError] = useState<string | null>(null);
  const [showRetryOptions, setShowRetryOptions] = useState(false);

  const persistForm = useCallback((payload: OnboardingState) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
    localStorage.setItem(HANDLE_STORAGE_KEY, payload.handle);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedHandle = localStorage.getItem(HANDLE_STORAGE_KEY);
    const storedPayload = localStorage.getItem(ONBOARDING_STORAGE_KEY);

    // Check for social connection success from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const socialConnectSuccess = urlParams.get('social_connect');
    const providerParam = urlParams.get('provider');
    const provider: RecoveryProvider | null =
      providerParam === 'x' || providerParam === 'twitter'
        ? 'x'
        : providerParam === 'google' || providerParam === 'gmail'
          ? 'google'
          : null;
    
    if (socialConnectSuccess === 'success' && provider) {
      // Social connection was successful, proceed to wallet creation
      setForm((prev) => {
        const updated: OnboardingState = {
          ...prev,
          recoveryMethod: provider,
        };
        persistForm(updated);
        return updated;
      });
      setShowWalletModal(true);
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const timeoutId = setTimeout(() => {
      if (storedPayload) {
        try {
          const parsed = JSON.parse(storedPayload) as OnboardingState;
          setForm({
    handle: parsed.handle ?? '',
    birthday: parsed.birthday ?? '',
    gender: parsed.gender ?? '',
    interests: Array.isArray(parsed.interests) ? parsed.interests : [],
    photos: Array.isArray(parsed.photos) && parsed.photos.length
      ? [...parsed.photos, ...Array(Math.max(0, 5 - parsed.photos.length)).fill('')].slice(0, 5)
      : Array(5).fill(''),
    recoveryMethod:
      parsed.recoveryMethod === 'x' || parsed.recoveryMethod === 'google'
        ? parsed.recoveryMethod
        : '',
  });
        } catch (error) {
          console.warn('Unable to parse onboarding payload', error);
        }
      } else if (storedHandle) {
        setForm((prev) => ({ ...prev, handle: storedHandle.toUpperCase() }));
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [persistForm]);

  useEffect(() => {
    if (!showWalletModal) {
      setWalletInfo(null);
      setHasCopiedPhrase(false);
      setIsGeneratingWallet(false);
      setBackupPassword('');
      setBackupPasswordConfirm('');
      setBackupError('');
      setBackupStatus('idle');
    }
  }, [showWalletModal]);

  useEffect(() => {
    if (showWalletModal) {
      setHasStoredBackup(hasPhraseBackup());
    }
  }, [showWalletModal]);

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
  }, [currentStepIndex, form]);

  const formatHandle = useCallback((value: string) => {
    return value.toUpperCase().replace(allowedCharacters, '');
  }, []);

  const handleNextStep = useCallback(() => {
    if (!isCurrentStepValid) return;

    if (currentStepIndex >= steps.length - 1) {
      return;
    }

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

  const handleRecoveryComplete = useCallback(
    (action: RecoveryAction) => {
      setForm((prev) => {
        const updated: OnboardingState = {
          ...prev,
          recoveryMethod: action === 'skip' ? '' : action,
        };
        persistForm(updated);
        return updated;
      });
      setShowWalletModal(true);
    },
    [persistForm]
  );

  const handleRecoveryLink = useCallback(
    async (provider: RecoveryProvider) => {
      setIsConnectingSocial(provider);
      setLastSocialProviderTried(provider);
      setSocialConnectionError(null);
      setShowRetryOptions(false);
      
      try {
        // Attempt real OAuth connection - the hook will generate a temporary wallet if needed
        if (provider === 'x') {
          await connectTwitter();
        } else {
          await connectGmail();
        }
        
        // If we get here, the OAuth redirect should have happened
        // The user will be redirected back after OAuth completion
      } catch (error) {
        console.error(`Error connecting ${provider}:`, error);
        const errorMessage = error instanceof Error ? error.message : `Failed to connect ${provider}`;
        setSocialConnectionError(errorMessage);
        setShowRetryOptions(true);
        
        // Fallback to mock connection for testing
        try {
          if (provider === 'x') {
            await connectTwitterMock();
          } else {
            await connectGmailMock();
          }
          // On successful mock connection, proceed to wallet creation
          handleRecoveryComplete(provider);
          setShowRetryOptions(false);
        } catch (mockError) {
          console.error(`Mock connection failed for ${provider}:`, mockError);
          const mockErrorMessage = mockError instanceof Error ? mockError.message : `Unable to connect ${provider}`;
          setSocialConnectionError(mockErrorMessage);
          setShowRetryOptions(true);
        }
      } finally {
        setIsConnectingSocial(null);
      }
    },
    [connectTwitter, connectGmail, connectTwitterMock, connectGmailMock, handleRecoveryComplete]
  );

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
      
      // If already selected, remove it
      if (alreadySelected) {
        return {
          ...prev,
          interests: prev.interests.filter((item) => item !== interestId),
        };
      }
      
      // If not selected and we have less than 4 interests, add it
      if (prev.interests.length < 4) {
        return {
          ...prev,
          interests: [...prev.interests, interestId],
        };
      }
      
      // If we already have 4 interests, don't add more
      return prev;
    });
  };

  const completeOnboarding = useCallback(() => {
    persistForm(form);
    setShowWalletModal(false);
    router.push('/swipe');
  }, [form, persistForm, router]);

  const handleCloseWalletModal = useCallback(() => {
    setShowWalletModal(false);
  }, []);

  const handleGenerateWallet = useCallback(() => {
    setIsGeneratingWallet(true);
    setHasCopiedPhrase(false);

    try {
      const mnemonic = generateMnemonic();
      const generatedWallet = createWallet(mnemonic);
      setWalletInfo(generatedWallet);
    } catch (error) {
      console.error('Unable to generate wallet', error);
    } finally {
      setIsGeneratingWallet(false);
    }
  }, [createWallet]);

  const handleCopySecretPhrase = useCallback(() => {
    if (!walletInfo) return;

    try {
      navigator.clipboard.writeText(walletInfo.secretPhrase);
      setHasCopiedPhrase(true);
    } catch (error) {
      console.error('Unable to copy passphrase', error);
    }
  }, [walletInfo]);

  const handleSkipWallet = useCallback(() => {
    // Generate and save wallet silently for later access
    try {
      const mnemonic = generateMnemonic();
      const generatedWallet = createWallet(mnemonic);
      saveWallet(generatedWallet);
    } catch (error) {
      console.error('Unable to generate wallet silently', error);
    }
    completeOnboarding();
  }, [createWallet, saveWallet, completeOnboarding]);

  const handleWalletContinue = useCallback(() => {
    if (walletInfo) {
      saveWallet(walletInfo);
    }
    completeOnboarding();
  }, [walletInfo, saveWallet, completeOnboarding]);

  const handleSaveEncryptedBackup = useCallback(async () => {
    if (!walletInfo) return;

    if (backupPassword.length < 8) {
      setBackupError('Password must be at least 8 characters.');
      return;
    }

    if (backupPassword !== backupPasswordConfirm) {
      setBackupError('Passwords do not match.');
      return;
    }

    try {
      setBackupError('');
      setBackupStatus('saving');
      const payload = await encryptPhrase(walletInfo.secretPhrase, backupPassword);
      storePhraseBackup(payload);
      setHasStoredBackup(true);
      setBackupStatus('saved');
      setBackupPassword('');
      setBackupPasswordConfirm('');
    } catch (error) {
      console.error('Unable to encrypt recovery phrase', error);
      setBackupError('Something went wrong while encrypting. Please try again.');
      setBackupStatus('idle');
    }
  }, [walletInfo, backupPassword, backupPasswordConfirm]);

  const currentStep = steps[currentStepIndex];
  const isHandleStep = currentStep === 'handle';
  const isRecoveryStep = currentStep === 'recovery';
  const isPreRecoveryStep = currentStepIndex === steps.length - 2;

  const renderStepContent = () => {
    switch (currentStep) {
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
          </>
        );
      case 'recovery':
        return (
          <>
            <div className="mt-8 space-y-3">
              <h1 className="display-font text-5xl leading-tight tracking-widest">ADD ACCOUNT RECOVERY</h1>
              <p className="ui-font text-sm italic text-ink-secondary whitespace-pre-line">
                {'// OPTIONAL BACKUP SIGN-IN. NO WALLET CONTROL GIVEN.'}
              </p>
            </div>

            <div className="recovery-card">
              <p className="recovery-card__lead">
                Link X or Google so you can get back into PumpInder if you ever log out. This method is for account access
                only — it will not recover your wallet.
              </p>
              <ul className="recovery-card__list">
                <li>The linked account is only used to authenticate you.</li>
                <li>We never see or store your wallet keys or secret phrase.</li>
                <li>You keep full control of your wallet — unlink anytime.</li>
              </ul>
              <p className="recovery-card__note">No private wallet data or recovery phrases are shared.</p>
            </div>

            <div className="recovery-options">
              {recoveryOptions.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className="recovery-option"
                  onClick={() => handleRecoveryLink(option.id)}
                  disabled={isConnectingSocial !== null}
                >
                  <span
                    className={`recovery-option__icon recovery-option__icon--${option.id}`}
                    aria-hidden="true"
                  >
                    {option.id === 'x' ? <Twitter size={22} /> : <GoogleGIcon />}
                  </span>
                  <span>
                    <span className="recovery-option__label">{option.label}</span>
                    <span className="recovery-option__caption">{option.description}</span>
                  </span>
                  <span className="recovery-option__cta">
                    {isConnectingSocial === option.id ? 'Connecting...' : 'Link'}
                  </span>
                </button>
              ))}
            </div>

            {socialConnectionError && (
              <div className="recovery-error">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-red-700 text-sm font-medium">Connection Failed</p>
                    <p className="text-red-600 text-sm mt-1">{socialConnectionError}</p>
                    
                    {showRetryOptions && (
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-md border border-red-300 transition-colors"
                          onClick={() => {
                            const provider = lastSocialProviderTried || 'x'; // Default to 'x' if no previous provider
                            if (provider) {
                              handleRecoveryLink(provider as RecoveryProvider);
                            }
                          }}
                        >
                          Try Again
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-md border border-gray-300 transition-colors"
                          onClick={() => {
                            setSocialConnectionError(null);
                            setShowRetryOptions(false);
                            handleRecoveryComplete('skip');
                          }}
                        >
                          Skip for Now
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-md border border-blue-300 transition-colors"
                          onClick={() => {
                            const alternativeProvider = lastSocialProviderTried === 'x' ? 'google' : 'x';
                            handleRecoveryLink(alternativeProvider as RecoveryProvider);
                          }}
                        >
                          Try {lastSocialProviderTried === 'x' ? 'Google' : 'X'} Instead
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="recovery-note">
              <p>Optional, but recommended.</p>
              <p>Link an account so you can log back in easily if you ever log out.</p>
            </div>

            <div className="flex flex-col items-center gap-2 mt-4">
              <button type="button" className="skip-link" onClick={() => handleRecoveryComplete('skip')}>
                Skip for now
              </button>
              <p className="recovery-skip-copy">You can finish this later from [Account recovery placeholder].</p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-canvas overflow-hidden">
      {/* Graph paper background already supplied globally */}

      {/* Branding */}
      <header className="absolute top-10 left-10 z-30">
        <button 
          onClick={handleBackToHome}
              className="display-font text-2xl tracking-[0.2em] hover:opacity-80 transition-opacity duration-200"
              style={{ textTransform: 'uppercase' }}
            >
              PUMPINDER™
            </button>
      </header>

      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <form className="onboarding-card" onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-4">
            <button
              type="button"
              className="ui-font text-sm text-ink-secondary hover:text-[#5D5FEF] hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              onClick={isHandleStep ? handleBackToHome : handlePreviousStep}
              disabled={!isHandleStep && currentStepIndex === 0}
            >
              {isHandleStep ? "< BACK TO HOME" : "< PREVIOUS"}
            </button>
            <div className="flex gap-2">
              {progressBlocks}
            </div>
          </div>

          {renderStepContent()}

          {!isRecoveryStep && (
            <button
              type="submit"
              className="btn-block" 
              style={{ marginTop: '3rem' }}
              disabled={!isCurrentStepValid}
            >
              {isPreRecoveryStep ? 'CONTINUE' : 'NEXT'}
            </button>
          )}
        </form>
      </main>

      {showWalletModal && (
        <div className="wallet-modal-overlay">
          <div className="onboarding-card wallet-modal">
            <button
              type="button"
              className="wallet-modal__close"
              onClick={handleCloseWalletModal}
              aria-label="Close wallet creation modal"
            >
              ×
            </button>
            <h2 className="display-font text-4xl leading-tight tracking-widest">YOUR PRIVATE PINDER WALLET</h2>

            {!walletInfo ? (
              <>
                <p className="ui-font text-sm text-ink-secondary mt-4">
                  Generated on your device, owned only by you. Create it now to jump straight into Swipe.
                </p>
                <div className="wallet-modal__security mt-4">
                  <p className="text-sm">
                    • The recovery phrase appears only here.<br />
                    • We never store or see it.<br />
                    • Lose it and this wallet can&apos;t be recovered.
                  </p>
                </div>
                <details className="wallet-modal__learn-more ui-font text-xs text-ink-secondary mt-6">
                  <summary>Learn more</summary>
                  <p>
                    This wallet is PumpInder-only so your main bags stay separate. Recommended now, but optional —
                    you can always set it up later.
                  </p>
                </details>

                <div className="wallet-modal__actions">
                  <button
                    type="button"
                    className="btn-block"
                    onClick={handleGenerateWallet}
                    disabled={isGeneratingWallet}
                  >
                    {isGeneratingWallet ? 'Generating…' : 'Create wallet & show passphrase'}
                  </button>
                  <button
                    type="button"
                    className="skip-link"
                    onClick={handleSkipWallet}
                  >
                    Skip for now
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="ui-font text-sm text-ink-secondary mt-4">
                  Save these words somewhere safe. They&apos;re the only way to unlock this wallet again.
                </p>
                <div className="wallet-passphrase-box">
                  <ol className="wallet-passphrase-grid">
                    {walletInfo.secretPhrase.split(' ').map((word, index) => (
                      <li key={`${word}-${index}`}>
                        <span>{index + 1}.</span>
                        <span>{word}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="wallet-modal__note">
                  Only you ever see this phrase. We can&apos;t resend it later — keep a private offline copy.
                </div>
                <div className="wallet-backup-panel">
                  <h3 className="display-font text-2xl tracking-[0.2em]">Secure backup</h3>
                  {hasStoredBackup ? (
                    <div className="wallet-backup__status">
                      <p className="ui-font text-sm text-ink-secondary">
                        Encrypted backup saved. Re-open it anytime via Settings → Security with your password.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="ui-font text-sm text-ink-secondary">
                        Create a password only you know. We&apos;ll encrypt these words in your browser so nobody else — including PumpInder — can decrypt them.
                      </p>
                      <div className="wallet-backup__inputs">
                        <label className="ui-font text-xs" htmlFor="backup-password">Backup password</label>
                        <input
                          id="backup-password"
                          type="password"
                          value={backupPassword}
                          onChange={(event) => setBackupPassword(event.target.value)}
                          className="wallet-backup__input"
                          placeholder="At least 8 characters"
                        />
                        <label className="ui-font text-xs" htmlFor="backup-password-confirm">Confirm password</label>
                        <input
                          id="backup-password-confirm"
                          type="password"
                          value={backupPasswordConfirm}
                          onChange={(event) => setBackupPasswordConfirm(event.target.value)}
                          className="wallet-backup__input"
                        />
                      </div>
                      {backupError && <p className="wallet-backup__error">{backupError}</p>}
                      <button
                        type="button"
                        className="btn-block wallet-backup__button"
                        onClick={handleSaveEncryptedBackup}
                        disabled={backupStatus === 'saving'}
                      >
                        {backupStatus === 'saving' ? 'Encrypting backup…' : 'Save encrypted backup'}
                      </button>
                    </>
                  )}
                </div>
                <div className="wallet-modal__actions">
                  <button
                    type="button"
                    className="btn-block"
                    onClick={handleWalletContinue}
                  >
                    I saved it — enter PumpInder
                  </button>
                  <button
                    type="button"
                    className="wallet-modal__secondary-btn"
                    onClick={handleCopySecretPhrase}
                  >
                    {hasCopiedPhrase ? 'Passphrase copied' : 'Copy passphrase' }
                  </button>
                  <button
                    type="button"
                    className="skip-link"
                    onClick={handleSkipWallet}
                  >
                    Create wallet & secure later
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Have Account Link */}
      <div className="fixed bottom-8 right-8 z-20">
        <button
          onClick={() => router.push('/login')}
          className="ui-font text-xs text-ink-secondary hover:text-[#5D5FEF] hover:scale-105 transition-all duration-200 bg-white border-2 border-black px-3 py-2 shadow-hard"
        >
          HAVE AN ACCOUNT? CONTINUE SWIPING
        </button>
      </div>
    </div>
  );
}
