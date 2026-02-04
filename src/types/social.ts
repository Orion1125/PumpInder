export type SocialProvider = 'twitter' | 'gmail';

export interface SocialAccount {
  id: string;
  wallet_public_key: string;
  provider: SocialProvider;
  provider_user_id?: string;
  handle?: string;
  email?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialAccountInsert {
  wallet_public_key: string;
  provider: SocialProvider;
  provider_user_id?: string;
  handle?: string;
  email?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  verified?: boolean;
}

export interface OAuthState {
  wallet: string;
  provider: SocialProvider;
  redirect_uri: string;
  state: string;
}