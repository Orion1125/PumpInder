'use client';

import { ReactNode } from 'react';
import { SupabaseProvider } from './SupabaseProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return <SupabaseProvider>{children}</SupabaseProvider>;
}
