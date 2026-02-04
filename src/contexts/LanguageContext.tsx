'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
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
  const { wallet } = useWallet();
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings | null>(null);

  useEffect(() => {
    const defaultSettings: AppearanceSettings = {
      theme: 'system',
      language: 'en',
      monochromePictures: false,
    };

    const loadSettings = async () => {
      if (!wallet?.publicKey) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('theme, language, monochrome_pictures')
          .eq('wallet_public_key', wallet.publicKey)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading appearance settings:', error);
        } else if (data) {
          setAppearanceSettings({
            theme: data.theme,
            language: data.language,
            monochromePictures: data.monochrome_pictures,
          });
        } else {
          setAppearanceSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Error loading appearance settings:', error);
        setAppearanceSettings(defaultSettings);
      } finally {
        // Settings loaded
      }
    };

    loadSettings();
  }, [wallet?.publicKey]);

  const language = appearanceSettings?.language || 'en';

  const updateAppearanceSettings = async (newSettings: Partial<AppearanceSettings>) => {
    if (!wallet?.publicKey) {
      console.error('Wallet not connected');
      return;
    }

    const updatedSettings = { ...appearanceSettings, ...newSettings } as AppearanceSettings;
    setAppearanceSettings(updatedSettings);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          wallet_public_key: wallet.publicKey,
          theme: updatedSettings.theme,
          language: updatedSettings.language,
          monochrome_pictures: updatedSettings.monochromePictures,
        }, {
          onConflict: 'wallet_public_key'
        });

      if (error) {
        throw error;
      }
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
