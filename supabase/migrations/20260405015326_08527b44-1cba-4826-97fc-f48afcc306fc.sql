
CREATE OR REPLACE FUNCTION public.restrict_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role to update any field (used by edge functions / webhooks)
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
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
END;
$$;
