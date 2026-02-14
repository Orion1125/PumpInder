'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';

type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
type Theme = 'light' | 'dark' | 'system';

interface AppearanceSettings {
  theme: Theme;
  language: Language;
  monochromePictures: boolean;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  appearanceSettings: AppearanceSettings | null;
  updateAppearanceSettings: (settings: Partial<AppearanceSettings>) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Import translations
import translations from '../translations';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings | null>(null);

  useEffect(() => {
    const defaultSettings: AppearanceSettings = {
      theme: 'system',
      language: 'en',
      monochromePictures: false,
    };

    const loadSettings = async () => {
      if (!publicKey) {
        setAppearanceSettings(defaultSettings);
        return;
      }

      try {
        const res = await fetch(`/api/settings?wallet=${publicKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setAppearanceSettings({
              theme: data.settings.theme || 'system',
              language: data.settings.language || 'en',
              monochromePictures: data.settings.monochromePictures ?? false,
            });
          } else {
            setAppearanceSettings(defaultSettings);
          }
        } else {
          setAppearanceSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Error loading appearance settings:', error);
        setAppearanceSettings(defaultSettings);
      }
    };

    loadSettings();
  }, [publicKey]);

  const language = appearanceSettings?.language || 'en';

  const updateAppearanceSettings = async (newSettings: Partial<AppearanceSettings>) => {
    if (!publicKey) {
      console.error('Wallet not connected');
      return;
    }

    const updatedSettings = { ...appearanceSettings, ...newSettings } as AppearanceSettings;
    setAppearanceSettings(updatedSettings);

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletPublicKey: publicKey,
          theme: updatedSettings.theme,
          language: updatedSettings.language,
          monochromePictures: updatedSettings.monochromePictures,
        }),
      });
    } catch (error) {
      console.error('Error saving appearance settings:', error);
    }
  };

  // Update HTML lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    updateAppearanceSettings({ language: lang });
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // Fallback to English if key not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = (value as Record<string, unknown>)[fallbackKey];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      appearanceSettings, 
      updateAppearanceSettings 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
