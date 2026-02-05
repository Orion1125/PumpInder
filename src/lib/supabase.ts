import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js';

// Create a mock client for build time when env vars are not available
function createMockClient() {
  return {
    rpc: () => ({ data: null, error: null }),
    from: () => ({
      select: () => ({ data: null, error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
  } as unknown as SupabaseClient;
}

// Create the actual Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured, using mock client');
    return createMockClient();
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// Export the Supabase client
export const supabase = createSupabaseClient();

// Types for our database tables
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          wallet_public_key: string
          handle: string
          birthday: string
          gender: string
          interests: string[]
          photos: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_public_key: string
          handle: string
          birthday: string
          gender: string
          interests: string[]
          photos: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_public_key?: string
          handle?: string
          birthday?: string
          gender?: string
          interests?: string[]
          photos?: string[]
          updated_at?: string
        }
      }
      social_accounts: {
        Row: {
          id: string
          wallet_public_key: string
          provider: 'twitter' | 'gmail'
          provider_user_id: string | null
          handle: string | null
          email: string | null
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_public_key: string
          provider: 'twitter' | 'gmail'
          provider_user_id?: string | null
          handle?: string | null
          email?: string | null
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_public_key?: string
          provider?: 'twitter' | 'gmail'
          provider_user_id?: string | null
          handle?: string | null
          email?: string | null
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          verified?: boolean
          updated_at?: string
        }
      }
      chat_threads: {
        Row: {
          id: string
          user_wallet: string
          match_wallet: string
          match_name: string
          match_avatar: string
          last_active: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_wallet: string
          match_wallet: string
          match_name: string
          match_avatar: string
          last_active?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_wallet?: string
          match_wallet?: string
          match_name?: string
          match_avatar?: string
          last_active?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          thread_id: string
          sender_wallet: string
          content: string
          status: 'sending' | 'sent' | 'read'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          sender_wallet: string
          content: string
          status?: 'sending' | 'sent' | 'read'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          sender_wallet?: string
          content?: string
          status?: 'sending' | 'sent' | 'read'
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          wallet_public_key: string
          theme: 'light' | 'dark' | 'system'
          language: string
          monochrome_pictures: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_public_key: string
          theme?: 'light' | 'dark' | 'system'
          language?: string
          monochrome_pictures?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_public_key?: string
          theme?: 'light' | 'dark' | 'system'
          language?: string
          monochrome_pictures?: boolean
          updated_at?: string
        }
      }
    }
  }
}