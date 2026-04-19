CREATE OR REPLACE FUNCTION public.restrict_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_session_user text := session_user;
  v_role_setting text := current_setting('role', true);
  v_jwt_role text := current_setting('request.jwt.claim.role', true);
  v_jwt_claims_role text;
BEGIN
  -- Try to extract role from full JWT claims jsonb (some flows put it here)
  BEGIN
    v_jwt_claims_role := current_setting('request.jwt.claims', true)::jsonb->>'role';
  EXCEPTION WHEN OTHERS THEN
    v_jwt_claims_role := NULL;
  END;

  -- Allow privileged backend roles to update any field.
  -- session_user reflects the actual connecting role (not swapped by SECURITY DEFINER).
  -- This covers: edge functions using service_role key, internal postgres/supabase_admin
  -- maintenance, and JWT-claim-based service_role detection.
  IF v_session_user IN ('service_role', 'postgres', 'supabase_admin', 'supabase_storage_admin', 'authenticator')
     OR v_role_setting = 'service_role'
     OR v_jwt_role = 'service_role'
     OR v_jwt_claims_role = 'service_role'
  THEN
    RETURN NEW;
  END IF;

  -- Regular authenticated users: only display_name and avatar_url may change
  NEW.is_pro := OLD.is_pro;
  NEW.subscription_tier := OLD.subscription_tier;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.scans_today := OLD.scans_today;
  NEW.scans_today_reset_at := OLD.scans_today_reset_at;
  NEW.user_id := OLD.user_id;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$function$;