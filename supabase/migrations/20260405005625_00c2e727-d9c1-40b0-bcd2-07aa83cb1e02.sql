
-- Fix 1: Replace broad profiles UPDATE policy with restricted one
-- Drop the existing permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create restricted UPDATE policy that only allows safe fields
-- Users can only update display_name and avatar_url
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a function to restrict which columns users can update
CREATE OR REPLACE FUNCTION public.restrict_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to change display_name and avatar_url
  -- Revert all other fields to their original values
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

-- Create trigger to enforce column restrictions on client updates
-- Service role bypasses RLS but triggers still fire; however service role
-- updates go through edge functions that set fields explicitly
DROP TRIGGER IF EXISTS restrict_profile_update_trigger ON public.profiles;
CREATE TRIGGER restrict_profile_update_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (current_setting('role') != 'service_role')
  EXECUTE FUNCTION public.restrict_profile_update();

-- Fix 2: Add UPDATE policy on scan-images storage bucket
CREATE POLICY "Users can update their own scan images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'scan-images' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'scan-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Fix 3: Replace feedback INSERT policy to validate email
DROP POLICY IF EXISTS "Authenticated users can insert feedback" ON public.feedback;
CREATE POLICY "Authenticated users can insert feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (user_email = auth.email() OR user_email = 'anonymous');
