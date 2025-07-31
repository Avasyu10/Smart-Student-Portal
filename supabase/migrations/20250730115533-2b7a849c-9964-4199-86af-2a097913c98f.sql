-- Add policy to allow teachers to view student profiles (needed for messaging)
CREATE POLICY "Teachers can view student profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles teacher_profile 
    WHERE teacher_profile.user_id = auth.uid() 
    AND teacher_profile.role = 'teacher'
  )
  AND role = 'student'
);

-- Add policy to allow students to view teacher profiles (needed for messaging)
CREATE POLICY "Students can view teacher profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles student_profile 
    WHERE student_profile.user_id = auth.uid() 
    AND student_profile.role = 'student'
  )
  AND role = 'teacher'
);