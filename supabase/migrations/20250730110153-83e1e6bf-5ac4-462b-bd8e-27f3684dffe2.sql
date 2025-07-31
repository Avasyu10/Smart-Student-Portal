-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  max_points INTEGER DEFAULT 100,
  instructions TEXT,
  file_types_allowed TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'txt'],
  max_file_size_mb INTEGER DEFAULT 10,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  file_url TEXT,
  file_name TEXT,
  file_size_mb DECIMAL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
  grade INTEGER,
  feedback TEXT,
  teacher_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Enable Row Level Security
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignments
CREATE POLICY "Teachers can view all assignments" 
ON public.assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'teacher'
  )
);

CREATE POLICY "Teachers can create assignments" 
ON public.assignments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'teacher'
  ) AND auth.uid() = created_by
);

CREATE POLICY "Teachers can update their own assignments" 
ON public.assignments 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Students can view active assignments" 
ON public.assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'student'
  ) AND status = 'active'
);

-- RLS Policies for submissions
CREATE POLICY "Students can view their own submissions" 
ON public.submissions 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own submissions" 
ON public.submissions 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own submissions" 
ON public.submissions 
FOR UPDATE 
USING (auth.uid() = student_id AND status IN ('draft', 'submitted'));

CREATE POLICY "Teachers can view submissions for their assignments" 
ON public.submissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.assignments 
    WHERE assignments.id = assignment_id 
    AND assignments.created_by = auth.uid()
  )
);

CREATE POLICY "Teachers can update submissions for their assignments" 
ON public.submissions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.assignments 
    WHERE assignments.id = assignment_id 
    AND assignments.created_by = auth.uid()
  )
);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for assignment files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignment-files', 'assignment-files', false);

-- Storage policies for assignment files
CREATE POLICY "Students can upload their assignment files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'assignment-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own assignment files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assignment-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can view all assignment files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assignment-files' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'teacher'
  )
);