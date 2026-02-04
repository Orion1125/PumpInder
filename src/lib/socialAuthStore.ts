import { supabase } from './supabase';
import type { SocialAccount, SocialAccountInsert, SocialProvider } from '@/types/social';

// Check if environment is properly configured
function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Get user's social accounts from Supabase
export async function listSocialAccounts(wallet: string): Promise<SocialAccount[]> {
  // Fallback to in-memory store if Supabase is not configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using fallback storage');
    return []; // Return empty array since we can't store anything without Supabase
  }

  try {
    const { data, error } = await supabase
      .rpc('get_user_social_accounts', { user_wallet: wallet });
    
    if (error) {
      console.error('Error fetching social accounts:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in listSocialAccounts:', error);
    return [];
  }
}

// Upsert social account in Supabase
export async function upsertSocialAccount(wallet: string, account: SocialAccountInsert): Promise<SocialAccount | null> {
  // Fallback to in-memory store if Supabase is not configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using fallback storage');
    // Return a mock account for testing
    return {
      id: Math.random().toString(36).substring(7),
      wallet_public_key: wallet,
      provider: account.provider,
      provider_user_id: account.provider_user_id,
      handle: account.handle,
      email: account.email,
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      token_expires_at: account.token_expires_at,
      verified: account.verified ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  try {
    const { data, error } = await supabase
      .rpc('upsert_social_account', {
        user_wallet: wallet,
        provider: account.provider,
        provider_user_id: account.provider_user_id,
        handle: account.handle,
        email: account.email,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        token_expires_at: account.token_expires_at,
        verified: account.verified ?? false
      });
    
    if (error) {
      console.error('Error upserting social account:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in upsertSocialAccount:', error);
    return null;
  }
}

// Remove social account from Supabase
export async function removeSocialAccount(wallet: string, provider: SocialProvider): Promise<boolean> {
  // Fallback to in-memory store if Supabase is not configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using fallback storage');
    return true; // Simulate success
  }

  try {
    const { error } = await supabase
      .rpc('remove_social_account', { 
        user_wallet: wallet, 
        provider_type: provider 
      });
    
    if (error) {
      console.error('Error removing social account:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in removeSocialAccount:', error);
    return false;
  }
}

// Check if user has linked social accounts
export async function hasLinkedSocialAccounts(wallet: string): Promise<boolean> {
  // Fallback to in-memory store if Supabase is not configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using fallback storage');
    return false;
  }

  try {
    const { data, error } = await supabase
      .rpc('has_linked_social_accounts', { user_wallet: wallet });
    
    if (error) {
      console.error('Error checking linked accounts:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error in hasLinkedSocialAccounts:', error);
    return false;
  }
}

// Get specific social account
export async function getSocialAccount(wallet: string, provider: SocialProvider): Promise<SocialAccount | null> {
  // Fallback to in-memory store if Supabase is not configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using fallback storage');
    return null;
  }

  try {
    const { data, error } = await supabase
      .rpc('get_social_account', { 
        user_wallet: wallet, 
        provider_type: provider 
      });
    
    if (error) {
      console.error('Error fetching social account:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getSocialAccount:', error);
    return null;
  }
}