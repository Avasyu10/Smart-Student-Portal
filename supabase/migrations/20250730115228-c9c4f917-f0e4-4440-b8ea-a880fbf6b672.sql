-- First, drop policies that reference the role column
DROP POLICY IF EXISTS "Teachers can view all assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can update their own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students can view active assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can view submissions for their assignments" ON public.submissions;
DROP POLICY IF EXISTS "Teachers can update submissions for their assignments" ON public.submissions;

-- Change the role column type to text
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE text USING role::text;

-- Set default value to 'student'
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'student';

-- Recreate the policies with text role values
CREATE POLICY "Teachers can view all assignments" 
ON public.assignments 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'teacher'))));

CREATE POLICY "Teachers can create assignments" 
ON public.assignments 
FOR INSERT 
WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'teacher')))) AND (auth.uid() = created_by));

CREATE POLICY "Teachers can update their own assignments" 
ON public.assignments 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Students can view active assignments" 
ON public.assignments 
FOR SELECT 
USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'student')))) AND (status = 'active'::text));

CREATE POLICY "Teachers can view submissions for their assignments" 
ON public.submissions 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM assignments
  WHERE ((assignments.id = submissions.assignment_id) AND (assignments.created_by = auth.uid()))));

CREATE POLICY "Teachers can update submissions for their assignments" 
ON public.submissions 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM assignments
  WHERE ((assignments.id = submissions.assignment_id) AND (assignments.created_by = auth.uid()))));

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Unknown User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'student')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Drop the enum type
DROP TYPE IF EXISTS user_role CASCADE;