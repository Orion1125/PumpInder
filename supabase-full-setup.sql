-- PumpInder Supabase Database Schema with Functions
-- Run this SQL in your Supabase SQL editor

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table for user profile data
CREATE TABLE profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_public_key TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  birthday DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  interests TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  twitter_handle TEXT,
  twitter_verified BOOLEAN DEFAULT FALSE,
  gmail_address TEXT,
  gmail_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social accounts table for OAuth connections
CREATE TABLE social_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_public_key TEXT NOT NULL REFERENCES profiles(wallet_public_key) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('twitter', 'gmail')),
  provider_user_id TEXT,
  handle TEXT,
  email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_public_key, provider)
);

-- Chat threads table
CREATE TABLE chat_threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_wallet TEXT NOT NULL REFERENCES profiles(wallet_public_key),
  match_wallet TEXT NOT NULL,
  match_name TEXT NOT NULL,
  match_avatar TEXT NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_wallet, match_wallet)
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_wallet TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table for appearance preferences
CREATE TABLE user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_public_key TEXT UNIQUE NOT NULL REFERENCES profiles(wallet_public_key),
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT NOT NULL DEFAULT 'en',
  monochrome_pictures BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_profiles_wallet_public_key ON profiles(wallet_public_key);
CREATE INDEX idx_profiles_handle ON profiles(handle);
CREATE INDEX idx_social_accounts_wallet ON social_accounts(wallet_public_key);
CREATE INDEX idx_social_accounts_provider ON social_accounts(provider);
CREATE INDEX idx_chat_threads_user_wallet ON chat_threads(user_wallet);
CREATE INDEX idx_chat_threads_match_wallet ON chat_threads(match_wallet);
CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX idx_chat_messages_sender_wallet ON chat_messages(sender_wallet);
CREATE INDEX idx_user_settings_wallet_public_key ON user_settings(wallet_public_key);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_threads_updated_at BEFORE UPDATE ON chat_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies - users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

-- Social accounts policies - users can only access their own social accounts
CREATE POLICY "Users can view own social accounts" ON social_accounts
    FOR SELECT USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

CREATE POLICY "Users can update own social accounts" ON social_accounts
    FOR UPDATE USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

CREATE POLICY "Users can insert own social accounts" ON social_accounts
    FOR INSERT WITH CHECK (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

CREATE POLICY "Users can delete own social accounts" ON social_accounts
    FOR DELETE USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

-- Chat threads policies - users can only access threads they're part of
CREATE POLICY "Users can view own chat threads" ON chat_threads
    FOR SELECT USING (user_wallet = auth.jwt() ->> 'wallet_public_key');

CREATE POLICY "Users can update own chat threads" ON chat_threads
    FOR UPDATE USING (user_wallet = auth.jwt() ->> 'wallet_public_key');

CREATE POLICY "Users can insert own chat threads" ON chat_threads
    FOR INSERT WITH CHECK (user_wallet = auth.jwt() ->> 'wallet_public_key');

-- Chat messages policies - users can only access messages in their threads
CREATE POLICY "Users can view messages in own threads" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE id = thread_id 
            AND user_wallet = auth.jwt() ->> 'wallet_public_key'
        )
    );

CREATE POLICY "Users can insert messages in own threads" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE id = thread_id 
            AND user_wallet = auth.jwt() ->> 'wallet_public_key'
        )
    );

-- User settings policies - users can only access their own settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

-- Function to handle user authentication via wallet
CREATE OR REPLACE FUNCTION authenticate_user(wallet_public_key TEXT)
RETURNS TABLE(jwt JSON) AS $$
DECLARE
    user_jwt JSON;
BEGIN
    -- Create a JWT token for the user
    user_jwt := json_build_object(
        'wallet_public_key', wallet_public_key,
        'role', 'authenticated',
        'exp', extract(epoch from now() + interval '7 days')
    );
    
    RETURN QUERY SELECT user_jwt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supabase functions for social account management

-- Function to get user's social accounts
CREATE OR REPLACE FUNCTION get_user_social_accounts(user_wallet TEXT)
RETURNS TABLE(
  id UUID,
  wallet_public_key TEXT,
  provider TEXT,
  provider_user_id TEXT,
  handle TEXT,
  email TEXT,
  verified BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.wallet_public_key,
    sa.provider,
    sa.provider_user_id,
    sa.handle,
    sa.email,
    sa.verified,
    sa.created_at,
    sa.updated_at
  FROM social_accounts sa
  WHERE sa.wallet_public_key = user_wallet
  ORDER BY sa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert social account
CREATE OR REPLACE FUNCTION upsert_social_account(
  user_wallet TEXT,
  provider TEXT,
  provider_user_id TEXT,
  handle TEXT DEFAULT NULL,
  email TEXT DEFAULT NULL,
  access_token TEXT DEFAULT NULL,
  refresh_token TEXT DEFAULT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  verified BOOLEAN DEFAULT FALSE
)
RETURNS social_accounts AS $$
DECLARE
  account_record social_accounts;
BEGIN
  -- Insert or update the social account
  INSERT INTO social_accounts (
    wallet_public_key,
    provider,
    provider_user_id,
    handle,
    email,
    access_token,
    refresh_token,
    token_expires_at,
    verified
  ) VALUES (
    user_wallet,
    provider,
    provider_user_id,
    handle,
    email,
    access_token,
    refresh_token,
    token_expires_at,
    verified
  )
  ON CONFLICT (wallet_public_key, provider)
  DO UPDATE SET
    provider_user_id = EXCLUDED.provider_user_id,
    handle = EXCLUDED.handle,
    email = EXCLUDED.email,
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    token_expires_at = EXCLUDED.token_expires_at,
    verified = EXCLUDED.verified,
    updated_at = NOW()
  RETURNING * INTO account_record;

  RETURN account_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove social account
CREATE OR REPLACE FUNCTION remove_social_account(user_wallet TEXT, provider_type TEXT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM social_accounts 
  WHERE wallet_public_key = user_wallet 
  AND provider = provider_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has linked social accounts
CREATE OR REPLACE FUNCTION has_linked_social_accounts(user_wallet TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM social_accounts 
    WHERE wallet_public_key = user_wallet
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get specific social account
CREATE OR REPLACE FUNCTION get_social_account(user_wallet TEXT, provider_type TEXT)
RETURNS social_accounts AS $$
DECLARE
  account_record social_accounts;
BEGIN
  SELECT * INTO account_record
  FROM social_accounts
  WHERE wallet_public_key = user_wallet
  AND provider = provider_type
  LIMIT 1;

  RETURN account_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;