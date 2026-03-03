-- Fix the overly permissive INSERT policy on feedback table
-- The edge function uses service_role which bypasses RLS, so we can restrict direct inserts
DROP POLICY "Allow insert from edge functions" ON public.feedback;

-- Only allow authenticated users to insert (edge function bypasses RLS via service_role anyway)
CREATE POLICY "Authenticated users can insert feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (true);
