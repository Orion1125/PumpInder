'use client';

import { ReactNode } from 'react';

/**
 * Placeholder Supabase provider so we can wire the real client later
 * without refactoring the component tree.
 */
export function SupabaseProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
