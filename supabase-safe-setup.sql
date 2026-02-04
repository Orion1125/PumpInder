-- PumpInder Supabase Database Schema with Functions - Safe Setup
-- Run this SQL in your Supabase SQL editor
-- This version handles existing tables gracefully

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
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
    RAISE NOTICE 'Table profiles created';
  ELSE
    RAISE NOTICE 'Table profiles already exists, skipping creation';
  END IF;
END $$;

-- Create social_accounts table only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'social_accounts') THEN
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
    RAISE NOTICE 'Table social_accounts created';
  ELSE
    RAISE NOTICE 'Table social_accounts already exists, skipping creation';
  END IF;
END $$;

-- Create chat_threads table only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_threads') THEN
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
    RAISE NOTICE 'Table chat_threads created';
  ELSE
    RAISE NOTICE 'Table chat_threads already exists, skipping creation';
  END IF;
END $$;

-- Create chat_messages table only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    CREATE TABLE chat_messages (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
      sender_wallet TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'read')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table chat_messages created';
  ELSE
    RAISE NOTICE 'Table chat_messages already exists, skipping creation';
  END IF;
END $$;

-- Create user_settings table only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    CREATE TABLE user_settings (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      wallet_public_key TEXT UNIQUE NOT NULL REFERENCES profiles(wallet_public_key),
      theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
      language TEXT NOT NULL DEFAULT 'en',
      monochrome_pictures BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table user_settings created';
  ELSE
    RAISE NOTICE 'Table user_settings already exists, skipping creation';
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_profiles_wallet_public_key') THEN
    CREATE INDEX idx_profiles_wallet_public_key ON profiles(wallet_public_key);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_profiles_handle') THEN
    CREATE INDEX idx_profiles_handle ON profiles(handle);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_social_accounts_wallet') THEN
    CREATE INDEX idx_social_accounts_wallet ON social_accounts(wallet_public_key);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_social_accounts_provider') THEN
    CREATE INDEX idx_social_accounts_provider ON social_accounts(provider);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_chat_threads_user_wallet') THEN
    CREATE INDEX idx_chat_threads_user_wallet ON chat_threads(user_wallet);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_chat_threads_match_wallet') THEN
    CREATE INDEX idx_chat_threads_match_wallet ON chat_threads(match_wallet);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_chat_messages_thread_id') THEN
    CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_chat_messages_sender_wallet') THEN
    CREATE INDEX idx_chat_messages_sender_wallet ON chat_messages(sender_wallet);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_settings_wallet_public_key') THEN
    CREATE INDEX idx_user_settings_wallet_public_key ON user_settings(wallet_public_key);
  END IF;
END $$;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_social_accounts_updated_at') THEN
    CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_chat_threads_updated_at') THEN
    CREATE TRIGGER update_chat_threads_updated_at BEFORE UPDATE ON chat_threads
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_chat_messages_updated_at') THEN
    CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_user_settings_updated_at') THEN
    CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (these can be recreated safely)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

-- Social accounts policies
DROP POLICY IF EXISTS "Users can view own social accounts" ON social_accounts;
CREATE POLICY "Users can view own social accounts" ON social_accounts
    FOR SELECT USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can update own social accounts" ON social_accounts;
CREATE POLICY "Users can update own social accounts" ON social_accounts
    FOR UPDATE USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can insert own social accounts" ON social_accounts;
CREATE POLICY "Users can insert own social accounts" ON social_accounts
    FOR INSERT WITH CHECK (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can delete own social accounts" ON social_accounts;
CREATE POLICY "Users can delete own social accounts" ON social_accounts
    FOR DELETE USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

-- Chat threads policies
DROP POLICY IF EXISTS "Users can view own chat threads" ON chat_threads;
CREATE POLICY "Users can view own chat threads" ON chat_threads
    FOR SELECT USING (user_wallet = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can update own chat threads" ON chat_threads;
CREATE POLICY "Users can update own chat threads" ON chat_threads
    FOR UPDATE USING (user_wallet = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can insert own chat threads" ON chat_threads;
CREATE POLICY "Users can insert own chat threads" ON chat_threads
    FOR INSERT WITH CHECK (user_wallet = auth.jwt() ->> 'wallet_public_key');

-- Chat messages policies
DROP POLICY IF EXISTS "Users can view messages in own threads" ON chat_messages;
CREATE POLICY "Users can view messages in own threads" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE id = thread_id 
            AND user_wallet = auth.jwt() ->> 'wallet_public_key'
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in own threads" ON chat_messages;
CREATE POLICY "Users can insert messages in own threads" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE id = thread_id 
            AND user_wallet = auth.jwt() ->> 'wallet_public_key'
        )
    );

-- User settings policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;-- PumpInder Supabase Database Schema with Functions - Safe Setup
-- Run this SQL in your Supabase SQL editor
-- This version handles existing tables gracefully

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
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
    RAISE NOTICE 'Table profiles created';
  ELSE
    RAISE NOTICE 'Table profiles already exists, skipping creation';
  END IF;
END $$;

-- Create social_accounts table only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'social_accounts') THEN
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
    RAISE NOTICE 'Table social_accounts created';
  ELSE
    RAISE NOTICE 'Table social_accounts already exists, skipping creation';
  END IF;
END $$;

-- Create chat_threads table only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_threads') THEN
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
    RAISE NOTICE 'Table chat_threads created';
  ELSE
    RAISE NOTICE 'Table chat_threads already exists, skipping creation';
  END IF;
END $$;

-- Create chat_messages table only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    CREATE TABLE chat_messages (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
      sender_wallet TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'read')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table chat_messages created';
  ELSE
    RAISE NOTICE 'Table chat_messages already exists, skipping creation';
  END IF;
END $$;

-- Create user_settings table only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    CREATE TABLE user_settings (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      wallet_public_key TEXT UNIQUE NOT NULL REFERENCES profiles(wallet_public_key),
      theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
      language TEXT NOT NULL DEFAULT 'en',
      monochrome_pictures BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table user_settings created';
  ELSE
    RAISE NOTICE 'Table user_settings already exists, skipping creation';
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_profiles_wallet_public_key') THEN
    CREATE INDEX idx_profiles_wallet_public_key ON profiles(wallet_public_key);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_profiles_handle') THEN
    CREATE INDEX idx_profiles_handle ON profiles(handle);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_social_accounts_wallet') THEN
    CREATE INDEX idx_social_accounts_wallet ON social_accounts(wallet_public_key);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_social_accounts_provider') THEN
    CREATE INDEX idx_social_accounts_provider ON social_accounts(provider);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_chat_threads_user_wallet') THEN
    CREATE INDEX idx_chat_threads_user_wallet ON chat_threads(user_wallet);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_chat_threads_match_wallet') THEN
    CREATE INDEX idx_chat_threads_match_wallet ON chat_threads(match_wallet);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_chat_messages_thread_id') THEN
    CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_chat_messages_sender_wallet') THEN
    CREATE INDEX idx_chat_messages_sender_wallet ON chat_messages(sender_wallet);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_settings_wallet_public_key') THEN
    CREATE INDEX idx_user_settings_wallet_public_key ON user_settings(wallet_public_key);
  END IF;
END $$;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_social_accounts_updated_at') THEN
    CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_chat_threads_updated_at') THEN
    CREATE TRIGGER update_chat_threads_updated_at BEFORE UPDATE ON chat_threads
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_chat_messages_updated_at') THEN
    CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_user_settings_updated_at') THEN
    CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (these can be recreated safely)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

-- Social accounts policies
DROP POLICY IF EXISTS "Users can view own social accounts" ON social_accounts;
CREATE POLICY "Users can view own social accounts" ON social_accounts
    FOR SELECT USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can update own social accounts" ON social_accounts;
CREATE POLICY "Users can update own social accounts" ON social_accounts
    FOR UPDATE USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can insert own social accounts" ON social_accounts;
CREATE POLICY "Users can insert own social accounts" ON social_accounts
    FOR INSERT WITH CHECK (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can delete own social accounts" ON social_accounts;
CREATE POLICY "Users can delete own social accounts" ON social_accounts
    FOR DELETE USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

-- Chat threads policies
DROP POLICY IF EXISTS "Users can view own chat threads" ON chat_threads;
CREATE POLICY "Users can view own chat threads" ON chat_threads
    FOR SELECT USING (user_wallet = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can update own chat threads" ON chat_threads;
CREATE POLICY "Users can update own chat threads" ON chat_threads
    FOR UPDATE USING (user_wallet = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can insert own chat threads" ON chat_threads;
CREATE POLICY "Users can insert own chat threads" ON chat_threads
    FOR INSERT WITH CHECK (user_wallet = auth.jwt() ->> 'wallet_public_key');

-- Chat messages policies
DROP POLICY IF EXISTS "Users can view messages in own threads" ON chat_messages;
CREATE POLICY "Users can view messages in own threads" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE id = thread_id 
            AND user_wallet = auth.jwt() ->> 'wallet_public_key'
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in own threads" ON chat_messages;
CREATE POLICY "Users can insert messages in own threads" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE id = thread_id 
            AND user_wallet = auth.jwt() ->> 'wallet_public_key'
        )
    );

-- User settings policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (wallet_public_key = auth.jwt() ->> 'wallet_public_key');

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
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