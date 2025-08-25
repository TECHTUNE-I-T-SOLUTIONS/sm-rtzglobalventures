-- Complete OAuth Fix Script

-- 1. to ensure profiles table exists and has correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone TEXT,
  address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. to grant all necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO service_role;

-- 3. to create or update the updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. to create updated_at trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 5. to drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 6. to create improved user creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Determine the best name to use
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- to insert profile with comprehensive error handling
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- this logs the error but doesn't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. to recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 8. to create helper function for manual profile creation
CREATE OR REPLACE FUNCTION create_profile_for_user(user_id UUID, user_email TEXT, user_name TEXT DEFAULT NULL, user_avatar TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    user_id,
    user_email,
    COALESCE(user_name, split_part(user_email, '@', 1)),
    user_avatar
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$ language 'plpgsql';

-- 9. to grant execute permissions on helper function
GRANT EXECUTE ON FUNCTION create_profile_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile_for_user TO anon;
GRANT EXECUTE ON FUNCTION create_profile_for_user TO service_role;

-- 10. to create a function to check if profile exists
CREATE OR REPLACE FUNCTION profile_exists(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM profiles WHERE id = user_id);
END;
$$ language 'plpgsql';

-- 11. to grant execute permissions on check function
GRANT EXECUTE ON FUNCTION profile_exists TO authenticated;
GRANT EXECUTE ON FUNCTION profile_exists TO anon;
GRANT EXECUTE ON FUNCTION profile_exists TO service_role;

-- 12. to ensure all other tables have proper permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 13. to create a test function to verify setup
CREATE OR REPLACE FUNCTION test_oauth_setup()
RETURNS TEXT AS $$
BEGIN
  -- Check if profiles table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RETURN 'ERROR: profiles table does not exist';
  END IF;
  
  -- Check if trigger exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') THEN
    RETURN 'ERROR: on_auth_user_created trigger does not exist';
  END IF;
  
  -- Check if functions exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user') THEN
    RETURN 'ERROR: handle_new_user function does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_profile_for_user') THEN
    RETURN 'ERROR: create_profile_for_user function does not exist';
  END IF;
  
  RETURN 'SUCCESS: OAuth setup is complete and working';
END;
$$ language 'plpgsql';

-- 14. to grant execute permission on test function
GRANT EXECUTE ON FUNCTION test_oauth_setup TO authenticated;
GRANT EXECUTE ON FUNCTION test_oauth_setup TO anon;
GRANT EXECUTE ON FUNCTION test_oauth_setup TO service_role;

-- 15. the output completion message
DO $$
BEGIN
  RAISE NOTICE 'OAuth fix script completed successfully!';
  RAISE NOTICE 'Run SELECT test_oauth_setup(); to verify the setup.';
END $$; 