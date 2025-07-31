-- First, update the profiles table to use text instead of enum
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE text USING role::text;

-- Set default value to 'student'
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'student';

-- Update the handle_new_user function to properly handle role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles with error handling
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Unknown User'),
    -- Check if role is specified in metadata, otherwise default to 'student'
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'student')
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate insertions
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update the create_user_profile function to use text
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id uuid, 
  p_email text, 
  p_full_name text, 
  p_role text DEFAULT 'student'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  profile_id UUID;
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (p_user_id, p_email, p_full_name, p_role)
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now()
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$function$;

-- Now we can safely drop the enum type if it's no longer needed
-- (Only if no other tables are using it)
DROP TYPE IF EXISTS user_role CASCADE;