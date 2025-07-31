-- Create storage policies to allow teachers to access assignment files
-- First, let's create a policy for teachers to view assignment files

CREATE POLICY "Teachers can view assignment files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assignment-files' 
  AND EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'teacher'
  )
);

-- Allow teachers to download assignment files
CREATE POLICY "Teachers can download assignment files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assignment-files' 
  AND EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'teacher'
  )
);