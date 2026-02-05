'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, Upload, Camera } from 'lucide-react';

interface OnboardingData {
  name: string;
  birthday: string;
  gender: string;
  pronouns: string;
  handle: string;
  interests: string[];
  photos: string[];
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const interestOptions = [
  { id: 'defi', label: 'DeFi' },
  { id: 'nfts', label: 'NFTs' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'trading', label: 'Trading' },
  { id: 'memes', label: 'Memes' },
  { id: 'builders', label: 'Builders' },
  { id: 'music', label: 'Music' },
  { id: 'photography', label: 'Photography' },
  { id: 'reading', label: 'Reading' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'travel', label: 'Travel' },
  { id: 'nature', label: 'Nature' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'food', label: 'Food' },
  { id: 'movies', label: 'Movies' },
  { id: 'art', label: 'Art' },
];

export default function Onboarding() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [data, setData] = useState<OnboardingData>({
    name: '',
    birthday: '',
    gender: '',
    pronouns: '',
    handle: '',
    interests: [],
    photos: [],
  });

  const totalSteps = 5;

  const updateData = (field: keyof OnboardingData, value: string | string[]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhotos = [...data.photos];
          newPhotos[index] = e.target?.result as string;
          updateData('photos', newPhotos);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const toggleInterest = (interestId: string) => {
    setData(prev => {
      const alreadySelected = prev.interests.includes(interestId);
      
      if (alreadySelected) {
        return {
          ...prev,
          interests: prev.interests.filter(item => item !== interestId),
        };
      }
      
      if (prev.interests.length < 4) {
        return {
          ...prev,
          interests: [...prev.interests, interestId],
        };
      }
      
      return prev;
    });
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return data.name.trim() !== '' && data.birthday !== '' && data.gender !== '';
      case 2:
        return data.handle.trim() !== '';
      case 3:
        return data.interests.length > 0;
      case 4:
        return data.photos.length >= 1 && data.photos[0] !== '';
      case 5:
        return true; // Optional wallet step
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: data.name,
          birthday: data.birthday,
          gender: data.gender,
          pronouns: data.pronouns || null,
          handle: data.handle.toLowerCase(),
          interests: data.interests,
          photos: data.photos.filter(photo => photo !== ''),
        });

      if (error) {
        console.error('Error creating profile:', error);
        setError('Failed to create profile. Please try again.');
        return;
      }

      await refreshProfile();
      router.push('/swipe');
    } catch (err) {
      console.error('Error in submitProfile:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Basic Information</h2>
            
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => updateData('name', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Birthday <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={data.birthday}
                onChange={(e) => updateData('birthday', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {genderOptions.map((gender) => (
                  <button
                    key={gender.value}
                    onClick={() => updateData('gender', gender.value)}
                    className={`px-4 py-3 rounded-lg border transition-colors ${
                      data.gender === gender.value
                        ? 'bg-white text-gray-900 border-white'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    {gender.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Pronouns (optional)
              </label>
              <input
                type="text"
                value={data.pronouns}
                onChange={(e) => updateData('pronouns', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                placeholder="e.g., they/them, she/her"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Choose Your Handle</h2>
            
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Handle <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-white/50">@</span>
                <input
                  type="text"
                  value={data.handle}
                  onChange={(e) => updateData('handle', e.target.value.replace('@', '').toLowerCase())}
                  className="w-full pl-8 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="yourhandle"
                />
              </div>
              <p className="text-white/50 text-sm mt-2">
                This is how others will find you on PumpInder
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Choose Your Interests</h2>
            
            <p className="text-white/70 text-sm mb-4">
              Select up to 4 interests that best describe you
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {interestOptions.map((interest) => (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  disabled={!data.interests.includes(interest.id) && data.interests.length >= 4}
                  className={`px-4 py-3 rounded-lg border transition-colors text-sm ${
                    data.interests.includes(interest.id)
                      ? 'bg-white text-gray-900 border-white'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  } ${
                    !data.interests.includes(interest.id) && data.interests.length >= 4
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {interest.label}
                </button>
              ))}
            </div>
            
            <p className="text-white/50 text-sm">
              {data.interests.length}/4 interests selected
            </p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Add Photos</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  onClick={() => handlePhotoUpload(index)}
                  className="relative aspect-square bg-white/10 border-2 border-dashed border-white/20 rounded-lg overflow-hidden cursor-pointer hover:border-white/40 transition-colors"
                >
                  {data.photos[index] ? (
                    <img
                      src={data.photos[index]}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/50">
                      {index === 0 ? (
                        <>
                          <Camera className="w-8 h-8 mb-2" />
                          <span className="text-sm">Display Photo</span>
                          <span className="text-xs text-red-400">Required</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 mb-1" />
                          <span className="text-xs">Photo {index + 1}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-white/50 text-sm">
              Add at least 1 photo to continue. The first photo will be your display picture.
            </p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Wallet Setup (Optional)</h2>
            
            <div className="bg-white/10 border border-white/20 rounded-lg p-6">
              <p className="text-white/70 mb-4">
                You can create a wallet now for on-chain actions like liking, superliking, and tipping. 
                This is completely optional and can be done later.
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/wallet/create')}
                  className="w-full bg-white hover:bg-white/90 text-gray-900 rounded-lg px-4 py-3 font-medium transition-colors"
                >
                  Create Wallet Now
                </button>
                
                <button 
                  onClick={submitProfile}
                  className="w-full bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-3 transition-colors"
                >
                  Skip for Now
                </button>
              </div>
              
              <p className="text-white/50 text-sm mt-4">
                You can create a wallet anytime from settings when you need it.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm">Step {currentStep} of {totalSteps}</span>
            <button
              onClick={() => router.push('/')}
              className="text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-white/10">
          {renderStep()}

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-500/20 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            
            <button
              onClick={currentStep === totalSteps ? submitProfile : nextStep}
              disabled={!validateStep() || isLoading}
              className="flex-1 px-4 py-3 bg-white hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed text-gray-900 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Saving...' : currentStep === totalSteps ? 'Complete Profile' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
