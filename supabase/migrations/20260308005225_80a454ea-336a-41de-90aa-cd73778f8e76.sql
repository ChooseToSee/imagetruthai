
CREATE TABLE public.consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  terms_version text NOT NULL,
  upload_consent_accepted boolean NOT NULL DEFAULT true,
  ai_disclaimer_accepted boolean NOT NULL DEFAULT true
);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent logs"
  ON public.consent_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow insert via service role or authenticated"
  ON public.consent_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_consent_logs_user_version ON public.consent_logs (user_id, terms_version);
