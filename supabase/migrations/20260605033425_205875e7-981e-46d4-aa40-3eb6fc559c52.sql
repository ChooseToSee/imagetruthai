
-- 1. Strip user_id from public shared report reads via a sanitized view
DROP POLICY IF EXISTS "Anyone can view public reports" ON public.shared_reports;

CREATE OR REPLACE VIEW public.public_shared_reports AS
SELECT
  id,
  share_token,
  confidence,
  verdict,
  image_url,
  is_public,
  created_at,
  file_name,
  manipulation,
  model_breakdown,
  tips,
  reasons
FROM public.shared_reports
WHERE is_public = true;

GRANT SELECT ON public.public_shared_reports TO anon, authenticated;

-- 2. Lock down SECURITY DEFINER email-queue wrappers — service role only
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
