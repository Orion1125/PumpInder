'use client';

import { ReactNode } from 'react';
import { WalletProvider } from './WalletProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <AuthProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </AuthProvider>
    </WalletProvider>
  );
}
