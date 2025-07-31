-- Create personal events table for user calendar events
CREATE TABLE public.personal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  event_type TEXT DEFAULT 'personal' CHECK (event_type IN ('personal', 'work', 'study', 'meeting', 'reminder', 'other')),
  color TEXT DEFAULT '#3b82f6',
  all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.personal_events ENABLE ROW LEVEL SECURITY;

-- Create policies for personal events
CREATE POLICY "Users can view their own events" 
ON public.personal_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events" 
ON public.personal_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" 
ON public.personal_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" 
ON public.personal_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_personal_events_updated_at
BEFORE UPDATE ON public.personal_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_personal_events_user_date ON public.personal_events(user_id, event_date);