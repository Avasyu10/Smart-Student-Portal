-- Create student_teachers table to track student-teacher relationships
CREATE TABLE public.student_teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, teacher_id)
);

-- Enable RLS
ALTER TABLE public.student_teachers ENABLE ROW LEVEL SECURITY;

-- Create policies for student_teachers
CREATE POLICY "Students can view their own teacher relationships" 
ON public.student_teachers 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'student' 
  AND profiles.user_id = student_id
));

CREATE POLICY "Students can create their own teacher relationships" 
ON public.student_teachers 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'student' 
  AND profiles.user_id = student_id
));

CREATE POLICY "Students can update their own teacher relationships" 
ON public.student_teachers 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'student' 
  AND profiles.user_id = student_id
));

CREATE POLICY "Teachers can view their student relationships" 
ON public.student_teachers 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'teacher' 
  AND profiles.user_id = teacher_id
));

-- Create trigger for timestamps
CREATE TRIGGER update_student_teachers_updated_at
BEFORE UPDATE ON public.student_teachers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();