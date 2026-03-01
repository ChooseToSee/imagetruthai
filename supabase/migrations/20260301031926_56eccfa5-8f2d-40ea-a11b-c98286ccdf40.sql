CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'feedback',
  message TEXT NOT NULL,
  user_email TEXT NOT NULL DEFAULT 'anonymous',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert from edge functions" ON public.feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read for service role only" ON public.feedback
  FOR SELECT USING (false);