'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  BarChart3,
  Bird,
  Book,
  Briefcase,
  CameraIcon,
  Cat,
  Cloud,
  Coffee,
  Dog,
  Dumbbell,
  Film,
  Fish,
  Gamepad2,
  Heart,
  Info,
  MoveLeft,
  MoveRight,
  Music,
  Palette,
  PenTool,
  Pizza,
  Plane,
  Plus,
  Smile,
  Star,
  Sun,
  Trash2,
  TreePine,
  TrendingUp,
  Upload,
  Vote,
  Wrench,
  Zap,
  Moon,
  Flower,
} from 'lucide-react';

import { AppHeader } from '@/components/AppHeader';
import { useWallet } from '@/hooks/useWallet';

const MAX_PHOTOS = 5;
const MAX_FAVORITE_TOKENS = 3;
const MAX_INTERESTS = 4;
const allowedHandleCharacters = /[^A-Z0-9_]/gi;

const genderOptions = ['FEMALE', 'MALE', 'NON-BINARY', 'PREFER NOT TO SAY'] as const;

const pronounSuggestions = ['SHE / HER', 'HE / HIM', 'THEY / THEM', 'SHE / THEY', 'HE / THEY'];

const socialHandleFields = [
  { id: 'x', label: 'X / TWITTER', placeholder: '@pumpinder' },
  { id: 'farcaster', label: 'FARCASTER', placeholder: 'farcaster://handle' },
  { id: 'lens', label: 'LENS', placeholder: 'lens.xyz/you' },
  { id: 'telegram', label: 'TELEGRAM', placeholder: '@handle' },
] as const;

type BaseSocialHandleKey = (typeof socialHandleFields)[number]['id'];
type SocialHandleKey = BaseSocialHandleKey | 'custom';

const defaultSocialHandles: Record<SocialHandleKey, string> = { custom: '', x: '', farcaster: '', lens: '', telegram: '' };

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
  { id: 'science', label: 'SCIENCE', icon: Zap },
  { id: 'space', label: 'SPACE', icon: Star },
  { id: 'animals', label: 'ANIMALS', icon: Cat },
  { id: 'dogs', label: 'DOGS', icon: Dog },
  { id: 'cats', label: 'CATS', icon: Cat },
  { id: 'birds', label: 'BIRDS', icon: Bird },
  { id: 'fish', label: 'FISH', icon: Fish },
  { id: 'gardening', label: 'GARDENING', icon: Flower },
  { id: 'weather', label: 'WEATHER', icon: Cloud },
  { id: 'nightlife', label: 'NIGHTLIFE', icon: Moon },
  { id: 'sunrise', label: 'SUNRISE', icon: Sun },
  { id: 'politics', label: 'POLITICS', icon: Vote },
  { id: 'romance', label: 'ROMANCE', icon: Heart },
];

type ProfileEditorState = {
  name: string;
  username: string;
  birthday: string;
  gender: string;
  pronouns: string;
  location: string;
  about: string;
  interests: string[];
  photos: string[];
  socialHandles: Record<SocialHandleKey, string>;
  favoriteTokens: string[];
  bestExperience: string;
  jobTitle: string;
  company: string;
  industry: string;
  experience: string;
};

const defaultForm: ProfileEditorState = {
  name: '',
  username: '',
  birthday: '',
  gender: '',
  pronouns: '',
  location: '',
  about: '',
  interests: [],
  photos: Array(MAX_PHOTOS).fill(''),
  socialHandles: { ...defaultSocialHandles },
  favoriteTokens: [],
  bestExperience: '',
  jobTitle: '',
  company: '',
  industry: '',
  experience: '',
};

const normalizeHandle = (value: string) => value.replace(allowedHandleCharacters, '');

const normalizePhotos = (photos?: string[]) => {
  const safe = Array.isArray(photos) ? photos : [];
  return [...safe, ...Array(Math.max(0, MAX_PHOTOS - safe.length)).fill('')].slice(0, MAX_PHOTOS);
};

export default function EditProfilePage() {
  const [form, setForm] = useState<ProfileEditorState>(defaultForm);
  const [favoriteTokenInput, setFavoriteTokenInput] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const photoCount = useMemo(() => form.photos.filter(Boolean).length, [form.photos]);
  const { publicKey, isConnected } = useWallet();

  useEffect(() => {
    if (!publicKey || !isConnected) return;

    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/profiles/${publicKey}`);
        if (!res.ok) return;
        const data = await res.json();
        const profile = data.profile;
        if (!profile) return;

        setForm((prev) => ({
          ...prev,
          name: profile.handle || '',
          username: profile.handle ? normalizeHandle(profile.handle) : '',
          birthday: profile.birthday || '',
          gender: profile.gender || '',
          pronouns: profile.pronouns || '',
          location: profile.location || '',
          about: profile.bio || '',
          interests: Array.isArray(profile.interests) ? profile.interests : [],
          photos: normalizePhotos(profile.photos),
          socialHandles: profile.socialHandles ? { ...defaultSocialHandles, ...profile.socialHandles } : { ...defaultSocialHandles },
          favoriteTokens: Array.isArray(profile.favoriteTokens) ? profile.favoriteTokens : [],
          bestExperience: profile.bestExperience || '',
          jobTitle: profile.jobTitle || '',
          company: profile.company || '',
          industry: profile.industry || '',
          experience: profile.experience || '',
        }));
      } catch (err) {
        console.warn('Unable to load profile from server', err);
      }
    };

    loadProfile();
  }, [publicKey, isConnected]);

  const handleInputChange = (field: keyof ProfileEditorState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = field === 'username' ? normalizeHandle(event.target.value) : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialHandleChange = (field: SocialHandleKey) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, socialHandles: { ...prev.socialHandles, [field]: event.target.value } }));
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


  const handleSetDisplayPhoto = (index: number) => {
    if (index === 0) return;
    setForm((prev) => {
      const updated = [...prev.photos];
      [updated[0], updated[index]] = [updated[index], updated[0]];
      return { ...prev, photos: updated };
    });
  };

  const handlePreviousPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? MAX_PHOTOS - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === MAX_PHOTOS - 1 ? 0 : prev + 1));
  };

  const handlePhotoSlotClick = (index: number) => {
    setCurrentPhotoIndex(index);
  };

  const toggleInterest = (interestId: string) => {
    setForm((prev) => {
      const alreadySelected = prev.interests.includes(interestId);

      if (alreadySelected) {
        return { ...prev, interests: prev.interests.filter((item) => item !== interestId) };
      }

      if (prev.interests.length >= MAX_INTERESTS) {
        return prev;
      }

      return { ...prev, interests: [...prev.interests, interestId] };
    });
  };

  const handleFavoriteTokenAdd = () => {
    const token = favoriteTokenInput.trim().toUpperCase();
    if (!token) return;
    if (form.favoriteTokens.includes(token)) {
      setFavoriteTokenInput('');
      return;
    }
    if (form.favoriteTokens.length >= MAX_FAVORITE_TOKENS) {
      console.error(`You can only spotlight ${MAX_FAVORITE_TOKENS} tokens.`);
      return;
    }
    setForm((prev) => ({ ...prev, favoriteTokens: [...prev.favoriteTokens, token] }));
    setFavoriteTokenInput('');
  };

  const handleFavoriteTokenRemove = (token: string) => {
    setForm((prev) => ({ ...prev, favoriteTokens: prev.favoriteTokens.filter((item) => item !== token) }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      console.error('Name is required.');
      return;
    }

    if (!form.username.trim()) {
      console.error('Username is required.');
      return;
    }

    if (!publicKey) {
      console.error('Wallet not connected.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const payload = {
        handle: normalizeHandle(form.username),
        birthday: form.birthday,
        gender: form.gender,
        interests: form.interests,
        photos: normalizePhotos(form.photos).filter(Boolean),
        bio: form.about,
        location: form.location,
        pronouns: form.pronouns,
        socialHandles: form.socialHandles,
        favoriteTokens: form.favoriteTokens,
        bestExperience: form.bestExperience,
        jobTitle: form.jobTitle,
        company: form.company,
        industry: form.industry,
        experience: form.experience,
      };

      const res = await fetch(`/api/profiles/${publicKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save profile');
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Unable to save profile', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="swipe-page edit-profile-page">
      <AppHeader activePage={null} />

      <div className="content-width">
        <header className="card editor-section span-12" aria-live="polite">
          <div className="editor-headline">
            <h1 className="display-font">EDIT YOUR PROFILE</h1>
            <p className="ui-font">
              {`Tune what the network sees. Update your story, manage your photo deck, and choose which tokens and handles represent you.`}
            </p>
          </div>
          <div className="editor-status-row">
            <span className="status-pill">
              {photoCount}/5 photos live
            </span>
            <span className="status-pill">
              {form.interests.length}/{MAX_INTERESTS} interests selected
            </span>
            <span className="status-pill">
              {form.favoriteTokens.length}/{MAX_FAVORITE_TOKENS} favorite tokens
            </span>
          </div>
        </header>

        <form className="edit-profile-grid" onSubmit={handleSubmit}>
          <section className="card editor-section span-8" aria-labelledby="identity-heading">
            <div className="section-heading" id="identity-heading">
              <h2 className="font-bold">Identity & Basics</h2>
              <p>{'// THE INFO VISIBLE FIRST'}</p>
            </div>
            <div className="editor-grid two-col">
              <label className="editor-field">
                <span className="font-bold">NAME</span>
                <input type="text" value={form.name} onChange={handleInputChange('name')} placeholder="CELESTE" required />
              </label>
              <label className="editor-field">
                <span className="font-bold">USERNAME</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={handleInputChange('username')}
                  placeholder="Pinder_Handle"
                  maxLength={20}
                  required
                />
                <small>{'// MIXED CASE ALLOWED. KEEP IT CLEAN.'}</small>
              </label>
            </div>
            <div className="editor-grid two-col">
              <label className="editor-field">
                <span className="font-bold">BIRTHDAY</span>
                <input type="date" value={form.birthday} onChange={handleInputChange('birthday')} />
              </label>
              <label className="editor-field">
                <span className="font-bold">GENDER</span>
                <select value={form.gender} onChange={handleInputChange('gender')}>
                  <option value="">SELECT</option>
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="editor-grid two-col">
              <label className="editor-field">
                <span className="font-bold">PRONOUNS</span>
                <input
                  type="text"
                  value={form.pronouns}
                  onChange={handleInputChange('pronouns')}
                  placeholder="SHE / THEY"
                  list="pronoun-suggestions"
                />
                <datalist id="pronoun-suggestions">
                  {pronounSuggestions.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>
              <label className="editor-field">
                <span className="font-bold">LOCATION</span>
                <input type="text" value={form.location} onChange={handleInputChange('location')} placeholder="LISBON, PT" />
              </label>
            </div>
          </section>

          <section className="card editor-section span-4" aria-labelledby="photo-heading">
            <div className="section-heading" id="photo-heading">
              <h2 className="font-bold">Photo Deck</h2>
              <p>{'// DISPLAY PIC = SLOT 01'}</p>
            </div>
            <p className="ui-font text-sm">{`Add, remove, or reorder photos. Slot 01 is your display picture — everyone sees it first.`}</p>
            
            {/* Photo Carousel */}
            <div className="photo-carousel mt-6">
              <div className="photo-carousel-container">
                {/* Current Photo Display with Overlay Navigation */}
                <div className="photo-carousel-main">
                  {/* Navigation Buttons as Overlays */}
                  <button 
                    type="button" 
                    className="carousel-nav carousel-nav--prev" 
                    onClick={handlePreviousPhoto}
                    aria-label="Previous photo"
                  >
                    <MoveLeft size={20} />
                  </button>
                  
                  <button 
                    type="button" 
                    className="carousel-nav carousel-nav--next" 
                    onClick={handleNextPhoto}
                    aria-label="Next photo"
                  >
                    <MoveRight size={20} />
                  </button>
                  
                  {(() => {
                    const photo = form.photos[currentPhotoIndex];
                    const label = currentPhotoIndex === 0 ? 'DISPLAY PICTURE' : `SLOT ${currentPhotoIndex + 1}`;
                    const isPrimary = currentPhotoIndex === 0;
                    
                    return (
                      <div className={`photo-slot photo-slot--carousel ${photo ? 'photo-slot--filled' : ''} ${isPrimary ? 'photo-slot--primary' : ''}`}>
                        <label className="photo-label-wrapper">
                          <input type="file" accept="image/*" className="photo-input" onChange={(event) => handlePhotoUpload(currentPhotoIndex, event.target.files)} />
                          {photo ? (
                            <Image src={photo} alt={label} className="photo-preview" width={350} height={350} />
                          ) : (
                            <div className="photo-placeholder">
                              <Upload size={32} />
                              <span className="photo-label">{label}</span>
                              <span className="photo-hint">CLICK TO UPLOAD</span>
                            </div>
                          )}
                        </label>
                        {photo && (
                          <div className="photo-actions" aria-label={`${label} actions`}>
                            {!isPrimary && (
                              <button type="button" onClick={() => handleSetDisplayPhoto(currentPhotoIndex)} aria-label="Set as display picture">
                                <Star size={16} />
                              </button>
                            )}
                            <button type="button" onClick={() => handleRemovePhoto(currentPhotoIndex)} aria-label="Remove photo">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                        {isPrimary && (
                          <span className="photo-chip">DISPLAYED</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              {/* Photo Indicators */}
              <div className="photo-indicators">
                {form.photos.map((photo, index) => (
                  <button
                    key={`indicator-${index}`}
                    type="button"
                    className={`photo-indicator ${index === currentPhotoIndex ? 'photo-indicator--active' : ''} ${photo ? 'photo-indicator--filled' : ''}`}
                    onClick={() => handlePhotoSlotClick(index)}
                    aria-label={`Go to photo ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="card editor-section span-12" aria-labelledby="story-heading">
            <div className="section-heading" id="story-heading">
              <h2 className="font-bold">About & Web3 Experience</h2>
              <p>{'// WHAT PEOPLE READ'}</p>
            </div>
            <div className="editor-grid two-col">
              <label className="editor-field">
                <span className="font-bold">ABOUT ME</span>
                <div className="textarea-wrapper">
                  <textarea
                    value={form.about}
                    onChange={handleInputChange('about')}
                    placeholder="NFT artist & sunrise chaser. Looking for someone bullish on life."
                    rows={4}
                    maxLength={500}
                  />
                  <span className="char-counter">{form.about.length}/500</span>
                </div>
              </label>
              <label className="editor-field">
                <span className="font-bold">BEST WEB3 EXPERIENCE</span>
                <textarea
                  value={form.bestExperience}
                  onChange={handleInputChange('bestExperience')}
                  placeholder="Hosted an IRL mint party on a rooftop. 200 wallets, zero rugs."
                  rows={4}
                />
                <small>{'// PUBLIC ON YOUR PROFILE.'}</small>
              </label>
            </div>
          </section>

          <section className="card editor-section span-12" aria-labelledby="job-heading">
            <div className="section-heading" id="job-heading">
              <h2 className="font-bold">Job & Career</h2>
              <p>{'// PROFESSIONAL BACKGROUND'}</p>
            </div>
            <div className="editor-grid two-col">
              <label className="editor-field">
                <span className="font-bold">JOB TITLE</span>
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={handleInputChange('jobTitle')}
                  placeholder="Senior Frontend Developer"
                />
              </label>
              <label className="editor-field">
                <span className="font-bold">COMPANY</span>
                <input
                  type="text"
                  value={form.company}
                  onChange={handleInputChange('company')}
                  placeholder="Crypto Innovations Inc."
                />
              </label>
            </div>
            <div className="editor-grid two-col">
              <label className="editor-field">
                <span className="font-bold">INDUSTRY</span>
                <input
                  type="text"
                  value={form.industry}
                  onChange={handleInputChange('industry')}
                  placeholder="Blockchain / Web3"
                />
              </label>
              <label className="editor-field">
                <span className="font-bold">YEARS OF EXPERIENCE</span>
                <select value={form.experience} onChange={handleInputChange('experience')}>
                  <option value="">SELECT</option>
                  <option value="0-1">0-1 years</option>
                  <option value="2-3">2-3 years</option>
                  <option value="4-5">4-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </label>
            </div>
            <p className="ui-font text-sm mt-4 flex items-center gap-2">
              <Briefcase size={14} /> {'Share your professional background to connect with career-minded individuals.'}
            </p>
          </section>

          <section className="card editor-section span-8" aria-labelledby="interest-heading">
            <div className="section-heading" id="interest-heading">
              <h2 className="font-bold">Interests & Tokens</h2>
              <p>{'// SIGNAL WHAT YOU\'RE INTO'}</p>
            </div>
            <div className="interest-meta">
              <span>{form.interests.length}/{MAX_INTERESTS} MAX</span>
              {form.interests.length >= MAX_INTERESTS && (
                <span className="interest-alert">
                  <AlertCircle size={14} /> LIMIT REACHED
                </span>
              )}
            </div>
            <div className="interests-grid mt-4">
              {interestOptions.map((interest) => {
                const Icon = interest.icon;
                const isSelected = form.interests.includes(interest.id);
                const disabled = form.interests.length >= MAX_INTERESTS && !isSelected;
                return (
                  <button
                    type="button"
                    key={interest.id}
                    className={`option-tile option-tile--compact ${isSelected ? 'option-tile--active' : ''} ${disabled ? 'option-tile--disabled' : ''}`}
                    onClick={() => toggleInterest(interest.id)}
                    disabled={disabled}
                  >
                    <span className="option-icon">
                      <Icon size={20} />
                    </span>
                    {interest.label}
                  </button>
                );
              })}
            </div>
            <div className="favorite-token-block">
              <label className="editor-field">
                <span className="font-bold">FAVORITE TOKENS (MAX {MAX_FAVORITE_TOKENS})</span>
                <div className="token-input-row">
                  <input
                    type="text"
                    value={favoriteTokenInput}
                    onChange={(event) => setFavoriteTokenInput(event.target.value.toUpperCase())}
                    placeholder="$PINDER"
                  />
                  <button type="button" onClick={handleFavoriteTokenAdd} disabled={!favoriteTokenInput.trim()}>
                    <Plus size={16} /> ADD
                  </button>
                </div>
                <small className="ui-font text-xs">{`Highlight up to three tokens. They appear on your public card.`}</small>
              </label>
              <div className="favorite-token-list">
                {form.favoriteTokens.map((token) => (
                  <span key={token} className="favorite-token-chip">
                    {token}
                    <button type="button" aria-label={`Remove ${token}`} onClick={() => handleFavoriteTokenRemove(token)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="card editor-section span-4" aria-labelledby="social-heading">
            <div className="section-heading" id="social-heading">
              <h2 className="font-bold">Social Handles</h2>
              <p>{'// MAKE IT EASY TO DM'}</p>
            </div>
            <div className="social-grid">
              {socialHandleFields.map((field) => (
                <label key={field.id} className="editor-field">
                  <span className="font-bold">{field.label}</span>
                  <input
                    type="text"
                    value={form.socialHandles[field.id]}
                    onChange={handleSocialHandleChange(field.id)}
                    placeholder={field.placeholder}
                  />
                </label>
              ))}
              <label className="editor-field">
                <span className="font-bold">CUSTOM LINK</span>
                <input
                  type="text"
                  value={form.socialHandles.custom}
                  onChange={handleSocialHandleChange('custom')}
                  placeholder="https://"
                />
              </label>
            </div>
            <p className="social-hint">
              <Info size={14} /> {'Only share handles you want others to see. All fields are optional.'}
            </p>
          </section>

                  </form>
      </div>
    </div>
  );
}
