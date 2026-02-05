-- Drop existing tables to recreate with auth schema
-- WARNING: This will delete all existing data!

DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_threads CASCADE;
DROP TABLE IF EXISTS social_accounts CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop the trigger function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop the authenticate_user function if it exists
DROP FUNCTION IF EXISTS authenticate_user(TEXT) CASCADE;

-- Drop other functions if they exist
DROP FUNCTION IF EXISTS get_user_social_accounts(TEXT) CASCADE;
DROP FUNCTION IF EXISTS upsert_social_account(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, BOOLEAN
) CASCADE;
DROP FUNCTION IF EXISTS remove_social_account(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS has_linked_social_accounts(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_social_account(TEXT, TEXT) CASCADE;
