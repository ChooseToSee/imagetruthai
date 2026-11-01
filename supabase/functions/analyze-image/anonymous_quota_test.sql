-- Runs against the real RPC inside a rolled-back transaction; persists no test data.
BEGIN;
DO $$
DECLARE
  hash_a text := repeat('a', 64);
  hash_b text := repeat('b', 64);
  browser_a text := '11111111-1111-4111-8111-111111111111';
  browser_b text := '22222222-2222-4222-8222-222222222222';
  initial_count bigint;
  result text;
BEGIN
  -- Isolate test fixtures transactionally, including existing successful trials.
  DELETE FROM public.anonymous_scans;
  SELECT count(*) INTO initial_count FROM public.anonymous_scans;
  result := public.check_anonymous_scan(hash_a, browser_a, false);
  IF result <> 'allowed' OR (SELECT count(*) FROM public.anonymous_scans) <> initial_count THEN
    RAISE EXCEPTION 'Failed/preflight scan must not consume allowance';
  END IF;
  IF public.check_anonymous_scan(hash_a, browser_a, true) <> 'allowed' THEN RAISE EXCEPTION 'First success rejected'; END IF;
  IF public.check_anonymous_scan(hash_a, browser_b, true) <> 'anonymous_limit_reached' THEN RAISE EXCEPTION 'Same IP bypass'; END IF;
  IF public.check_anonymous_scan(hash_b, browser_a, true) <> 'anonymous_limit_reached' THEN RAISE EXCEPTION 'Same browser bypass'; END IF;
  IF (SELECT count(*) FROM public.anonymous_scans) <> 1 THEN RAISE EXCEPTION 'Exactly ONE success required'; END IF;
  UPDATE public.anonymous_scans SET scanned_at = clock_timestamp() - interval '23 hours 59 minutes';
  IF public.check_anonymous_scan(hash_a, browser_a, false) <> 'anonymous_limit_reached' THEN RAISE EXCEPTION 'Rolling 24h enforced too early'; END IF;
  UPDATE public.anonymous_scans SET scanned_at = clock_timestamp() - interval '24 hours';
  IF public.check_anonymous_scan(hash_a, browser_a, true) <> 'allowed' THEN RAISE EXCEPTION '24h expiry failed'; END IF;
  DELETE FROM public.anonymous_scans;
  INSERT INTO public.anonymous_scans (ip_hash, browser_id)
    SELECT md5(i::text) || md5(i::text), gen_random_uuid()::text FROM generate_series(1,149) i;
  IF public.check_anonymous_scan(hash_a, browser_a, true) <> 'allowed' THEN RAISE EXCEPTION '150th success rejected'; END IF;
  IF public.check_anonymous_scan(hash_b, browser_b, true) <> 'anonymous_capacity_reached' THEN RAISE EXCEPTION '151st success allowed'; END IF;
  IF (SELECT count(*) FROM public.anonymous_scans) <> 150 THEN RAISE EXCEPTION 'Global cap exceeds 150'; END IF;
  IF has_table_privilege('anon', 'public.anonymous_scans', 'SELECT') OR has_table_privilege('authenticated', 'public.anonymous_scans', 'INSERT') THEN RAISE EXCEPTION 'Client table exposure'; END IF;
  IF has_function_privilege('anon','public.check_anonymous_scan(text,text,boolean)','EXECUTE') OR has_function_privilege('authenticated','public.check_anonymous_scan(text,text,boolean)','EXECUTE') THEN RAISE EXCEPTION 'Client quota bypass'; END IF;
END $$;
ROLLBACK;