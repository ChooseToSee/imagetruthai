
-- Drop the previously created view (linter flagged it as SECURITY DEFINER)
DROP VIEW IF EXISTS public.public_shared_reports;

-- Restore public read access on shared_reports (anyone can read public ones,
-- owners can still read their own). Owners' policy already exists.
CREATE POLICY "Anyone can view public reports"
ON public.shared_reports
FOR SELECT
TO anon, authenticated
USING (is_public = true);

-- Hide user_id at the column-grant level. Owner SELECTs do not request user_id
-- (verified across the app); service_role keeps full access.
REVOKE SELECT ON public.shared_reports FROM anon, authenticated;

GRANT SELECT
  (id, share_token, confidence, verdict, image_url, is_public,
   created_at, file_name, manipulation, model_breakdown, tips, reasons)
ON public.shared_reports TO anon, authenticated;
