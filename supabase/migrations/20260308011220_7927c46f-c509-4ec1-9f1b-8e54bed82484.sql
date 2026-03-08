
-- Drop the overly broad ALL policy and replace with specific ones
DROP POLICY "Users can manage their own reports" ON public.shared_reports;

CREATE POLICY "Users can select their own reports"
ON public.shared_reports FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
ON public.shared_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
ON public.shared_reports FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
ON public.shared_reports FOR DELETE TO authenticated
USING (auth.uid() = user_id);
