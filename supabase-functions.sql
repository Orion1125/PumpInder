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