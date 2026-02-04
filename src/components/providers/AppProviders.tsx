'use client';

import { ReactNode } from 'react';
import { SupabaseProvider } from './SupabaseProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <SupabaseProvider>{children}</SupabaseProvider>
    </LanguageProvider>
  );
}
