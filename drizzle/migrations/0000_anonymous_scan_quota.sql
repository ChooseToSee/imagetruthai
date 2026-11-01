CREATE TABLE public.anonymous_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  browser_id text NOT NULL,
  scanned_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.anonymous_scans TO service_role;
REVOKE ALL ON public.anonymous_scans FROM anon, authenticated;
ALTER TABLE public.anonymous_scans ENABLE ROW LEVEL SECURITY;
CREATE INDEX anonymous_scans_ip_time_idx ON public.anonymous_scans (ip_hash, scanned_at);
CREATE INDEX anonymous_scans_browser_time_idx ON public.anonymous_scans (browser_id, scanned_at);
CREATE INDEX anonymous_scans_time_idx ON public.anonymous_scans (scanned_at);

-- Check before work, then recheck and insert atomically after successful analysis.
-- Concurrent analyses can never both consume the same allowance or exceed the cap.
CREATE FUNCTION public.check_anonymous_scan(p_ip_hash text, p_browser_id text, p_commit boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  cutoff timestamptz;
BEGIN
  IF p_ip_hash IS NULL OR p_ip_hash !~ '^[0-9a-f]{64}$'
     OR p_browser_id IS NULL OR p_browser_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid anonymous scan identifiers';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(7700000000000002);
  cutoff := clock_timestamp() - interval '24 hours';
  IF EXISTS (
    SELECT 1 FROM public.anonymous_scans
    WHERE scanned_at > cutoff AND (ip_hash = p_ip_hash OR browser_id = p_browser_id)
  ) THEN
    RETURN 'anonymous_limit_reached';
  END IF;
  IF (SELECT count(*) FROM public.anonymous_scans WHERE scanned_at > cutoff) >= 150 THEN
    RETURN 'anonymous_capacity_reached';
  END IF;
  IF p_commit THEN
    INSERT INTO public.anonymous_scans (ip_hash, browser_id, scanned_at)
    VALUES (p_ip_hash, p_browser_id, clock_timestamp());
  END IF;
  RETURN 'allowed';
END;
$$;
REVOKE ALL ON FUNCTION public.check_anonymous_scan(text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_anonymous_scan(text, text, boolean) TO service_role;