'use client';

import { useState, useEffect } from 'react';
import { Eye, Palette, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

interface AppearanceSettings {
  theme: Theme;
  language: Language;
  monochromePictures: boolean;
}

const themeOptions: { value: Theme; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Bright, clean interface' },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
  { value: 'system', label: 'System', description: 'Follows your device setting' },
];

const languageOptions: { value: Language; label: string; nativeName: string }[] = [
  { value: 'en', label: 'English', nativeName: 'English' },
  { value: 'es', label: 'Spanish', nativeName: 'Español' },
  { value: 'fr', label: 'French', nativeName: 'Français' },
  { value: 'de', label: 'German', nativeName: 'Deutsch' },
  { value: 'ja', label: 'Japanese', nativeName: '日本語' },
  { value: 'zh', label: 'Chinese', nativeName: '中文' },
];

export default function AppearanceModal({ isOpen, onClose }: AppearanceModalProps) {
  const { t, setLanguage } = useLanguage();
  const getInitialSettings = (): AppearanceSettings => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appearance-settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.warn('Failed to load appearance settings:', error);
        }
      }
    }
    return {
      theme: 'system',
      language: 'en',
      monochromePictures: false,
    };
  };

  const [settings, setSettings] = useState<AppearanceSettings>(getInitialSettings);

  // Apply theme changes immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      if (settings.theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else if (settings.theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else {
        // System preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
      }
    }
  }, [settings.theme]);

  const saveSettings = (newSettings: AppearanceSettings) => {
    setSettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('appearance-settings', JSON.stringify(newSettings));
    }
  };

  const handleThemeChange = (theme: Theme) => {
    saveSettings({ ...settings, theme });
  };

  const handleLanguageChange = (newLanguage: Language) => {
    saveSettings({ ...settings, language: newLanguage });
    setLanguage(newLanguage);
  };

  const handleMonochromeToggle = () => {
    saveSettings({ ...settings, monochromePictures: !settings.monochromePictures });
  };

  if (!isOpen) return null;

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="onboarding-card wallet-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="wallet-modal__close"
          onClick={onClose}
          aria-label="Close appearance settings"
        >
          ×
        </button>
        
        <h2 className="display-font text-4xl leading-tight tracking-widest">{t('appearance.title')}</h2>
        
        <div className="mt-6 space-y-4">
          <p className="ui-font text-sm text-ink-secondary">
            {t('appearance.description')}
          </p>
        </div>

        {/* Theme Selection */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Palette size={20} strokeWidth={2} />
            <h3 className="font-mono text-sm font-bold tracking-wider uppercase">{t('appearance.theme')}</h3>
          </div>
          
          <div className="space-y-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`w-full flex items-center justify-between p-4 border-2 rounded-md transition-all duration-200 ${
                  settings.theme === option.value
                    ? 'border-black bg-black text-white'
                    : 'border-black bg-white hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#121212] active:translate-y-[2px] active:shadow-[0px_0px_0px_#121212]'
                }`}
                onClick={() => handleThemeChange(option.value)}
              >
                <div className="text-left">
                  <div className="font-mono text-sm font-bold tracking-wider uppercase">
                    {t(`appearance.${option.value}`)}
                  </div>
                  <div className={`font-mono text-xs ${
                    settings.theme === option.value ? 'text-gray-300' : 'text-ink-secondary'
                  }`}>
                    {t(`appearance.${option.value}Description`)}
                  </div>
                </div>
                {settings.theme === option.value && (
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-black rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Globe size={20} strokeWidth={2} />
            <h3 className="font-mono text-sm font-bold tracking-wider uppercase">{t('appearance.appLanguage')}</h3>
          </div>
          
          <div className="relative">
            <select
              value={settings.language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="w-full p-4 border-2 border-black rounded-md bg-white font-mono text-sm tracking-wider uppercase cursor-pointer focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`common.${option.label.toLowerCase()}`)} - {option.nativeName}
                </option>
              ))}
            </select>
          </div>
          
          <p className="font-mono text-xs text-ink-secondary">
            {t('appearance.languageDescription')}
          </p>
        </div>

        {/* Monochrome Pictures Toggle */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Eye size={20} strokeWidth={2} />
            <h3 className="font-mono text-sm font-bold tracking-wider uppercase">{t('appearance.monochromePictures')}</h3>
          </div>
          
          <button
            type="button"
            onClick={handleMonochromeToggle}
            className={`w-full flex items-center justify-between p-4 border-2 rounded-md transition-all duration-200 ${
              settings.monochromePictures
                ? 'border-black bg-black text-white'
                : 'border-black bg-white hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#121212] active:translate-y-[2px] active:shadow-[0px_0px_0px_#121212]'
            }`}
          >
            <div className="text-left">
              <div className="font-mono text-sm font-bold tracking-wider uppercase">
                {settings.monochromePictures ? t('appearance.monochromeEnabled') : t('appearance.monochromeDisabled')}
              </div>
              <div className={`font-mono text-xs ${
                settings.monochromePictures ? 'text-gray-300' : 'text-ink-secondary'
              }`}>
                {settings.monochromePictures 
                  ? t('appearance.monochromeOnDescription')
                  : t('appearance.monochromeOffDescription')
                }
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
              settings.monochromePictures ? 'bg-black border-2 border-white' : 'bg-gray-300'
            }`}>
              <div className={`w-4 h-4 rounded-full transition-all duration-200 mx-1 ${
                settings.monochromePictures ? 'bg-white ml-auto mr-1' : 'bg-black mr-auto ml-1'
              }`}></div>
            </div>
          </button>
          
          <p className="font-mono text-xs text-ink-secondary">
            {t('appearance.monochromeNote')}
          </p>
        </div>

        <div className="wallet-modal__actions mt-8">
          <button
            type="button"
            className="btn-block"
            onClick={onClose}
          >
            {t('appearance.done')}
          </button>
        </div>
      </div>
    </div>
  );
}
