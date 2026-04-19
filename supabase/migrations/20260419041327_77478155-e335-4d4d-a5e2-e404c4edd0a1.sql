-- Fix restrict_profile_update so service_role API calls (used by edge functions
-- to increment scans_today / sync subscription) actually bypass the restriction.
-- The previous version only checked the JWT claim role, which is not reliably
-- set to 'service_role' by PostgREST when called with the service-role key.
CREATE OR REPLACE FUNCTION public.restrict_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service_role to update any field. Check both the Postgres session role
  -- (set by PostgREST when using the service-role key) and the JWT claim role
  -- (set by some auth flows) so edge functions can reliably bypass restrictions.
  IF current_user = 'service_role'
     OR current_setting('role', true) = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  THEN
    RETURN NEW;
  END IF;

  -- For regular users, only allow display_name and avatar_url changes
  NEW.is_pro := OLD.is_pro;
  NEW.subscription_tier := OLD.subscription_tier;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.scans_today := OLD.scans_today;
  NEW.scans_today_reset_at := OLD.scans_today_reset_at;
  NEW.user_id := OLD.user_id;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If JSON parsing fails, fall back to user-restricted behavior
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