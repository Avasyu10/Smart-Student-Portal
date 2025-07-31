-- Create rubrics table for grading criteria
CREATE TABLE public.rubrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  total_points integer NOT NULL DEFAULT 100,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create rubric criteria table
CREATE TABLE public.rubric_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id uuid NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  max_points integer NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create submission grades table for detailed grading results
CREATE TABLE public.submission_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  rubric_id uuid REFERENCES rubrics(id) ON DELETE SET NULL,
  ai_review text,
  ai_grade integer,
  ai_feedback text,
  teacher_review text,
  teacher_grade integer,
  teacher_feedback text,
  strengths text[],
  improvements text[],
  grammar_score integer,
  content_score integer,
  structure_score integer,
  creativity_score integer,
  overall_score integer,
  graded_by uuid,
  graded_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create detailed criteria grades table
CREATE TABLE public.criteria_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_grade_id uuid NOT NULL REFERENCES submission_grades(id) ON DELETE CASCADE,
  criteria_id uuid NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
  ai_score integer,
  teacher_score integer,
  ai_comment text,
  teacher_comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria_grades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rubrics
CREATE POLICY "Teachers can manage their own rubrics"
ON public.rubrics
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'teacher'
) AND created_by = auth.uid());

CREATE POLICY "Teachers can view all rubrics"
ON public.rubrics
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'teacher'
));

-- RLS Policies for rubric criteria
CREATE POLICY "Teachers can manage criteria for their rubrics"
ON public.rubric_criteria
FOR ALL
USING (EXISTS (
  SELECT 1 FROM rubrics r, profiles p
  WHERE r.id = rubric_criteria.rubric_id
  AND r.created_by = p.user_id
  AND p.user_id = auth.uid()
  AND p.role = 'teacher'
));

-- RLS Policies for submission grades
CREATE POLICY "Teachers can manage grades for their assignments"
ON public.submission_grades
FOR ALL
USING (EXISTS (
  SELECT 1 FROM submissions s, assignments a, profiles p
  WHERE s.id = submission_grades.submission_id
  AND s.assignment_id = a.id
  AND a.created_by = p.user_id
  AND p.user_id = auth.uid()
  AND p.role = 'teacher'
));

CREATE POLICY "Students can view their own grades"
ON public.submission_grades
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM submissions s, profiles p
  WHERE s.id = submission_grades.submission_id
  AND s.student_id = p.user_id
  AND p.user_id = auth.uid()
  AND p.role = 'student'
));

-- RLS Policies for criteria grades
CREATE POLICY "Teachers can manage criteria grades"
ON public.criteria_grades
FOR ALL
USING (EXISTS (
  SELECT 1 FROM submission_grades sg, submissions s, assignments a, profiles p
  WHERE sg.id = criteria_grades.submission_grade_id
  AND sg.submission_id = s.id
  AND s.assignment_id = a.id
  AND a.created_by = p.user_id
  AND p.user_id = auth.uid()
  AND p.role = 'teacher'
));

-- Add triggers for timestamp updates
CREATE TRIGGER update_rubrics_updated_at
BEFORE UPDATE ON public.rubrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_submission_grades_updated_at
BEFORE UPDATE ON public.submission_grades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_rubrics_created_by ON public.rubrics(created_by);
CREATE INDEX idx_rubric_criteria_rubric_id ON public.rubric_criteria(rubric_id);
CREATE INDEX idx_submission_grades_submission_id ON public.submission_grades(submission_id);
CREATE INDEX idx_criteria_grades_submission_grade_id ON public.criteria_grades(submission_grade_id);

-- Add assignment rubric relationship
ALTER TABLE public.assignments 
ADD COLUMN rubric_id uuid REFERENCES rubrics(id) ON DELETE SET NULL;