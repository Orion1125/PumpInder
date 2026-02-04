'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Import translations
import translations from '../translations';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const getInitialLanguage = (): Language => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appearance-settings');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          if (settings.language) {
            return settings.language;
          }
        } catch (error) {
          console.warn('Failed to load language settings:', error);
        }
      }
    }
    return 'en';
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Update HTML lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    
    // Update localStorage appearance settings
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appearance-settings');
      let settings = { theme: 'system', language: 'en', monochromePictures: false };
      
      if (saved) {
        try {
          settings = JSON.parse(saved);
        } catch (error) {
          console.warn('Failed to parse appearance settings:', error);
        }
      }
      
      settings.language = lang;
      localStorage.setItem('appearance-settings', JSON.stringify(settings));
    }
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
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
