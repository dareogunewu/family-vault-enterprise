-- Create a trigger to automatically create user profiles
-- Run this after the main schema to sync auth.users with public.users

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    master_key_hash,
    encrypted_user_key,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    'temp_key_hash', -- Will be updated after email verification
    '{"data":"temp","iv":"temp"}', -- Will be updated after email verification
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    email_verified = NEW.email_confirmed_at IS NOT NULL,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow service role to insert users (for the trigger)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.users TO service_role;