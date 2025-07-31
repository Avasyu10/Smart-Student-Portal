-- Add plagiarism tracking columns to submissions table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS plagiarism_score INTEGER,
ADD COLUMN IF NOT EXISTS plagiarism_report JSONB;

-- Create student feedback analysis table
CREATE TABLE IF NOT EXISTS public.student_feedback_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  sentiment_analysis JSONB NOT NULL,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  feedback_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on student_feedback_analysis
ALTER TABLE public.student_feedback_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for student_feedback_analysis
CREATE POLICY "Students can view their own feedback analysis" 
ON public.student_feedback_analysis 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Service role can manage feedback analysis" 
ON public.student_feedback_analysis 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create unique constraint on student_id for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_feedback_analysis_student_id 
ON public.student_feedback_analysis(student_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_student_feedback_analysis_updated_at
BEFORE UPDATE ON public.student_feedback_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();