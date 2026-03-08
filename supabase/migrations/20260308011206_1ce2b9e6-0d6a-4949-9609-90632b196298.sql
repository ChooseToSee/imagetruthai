
CREATE TABLE public.shared_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public boolean NOT NULL DEFAULT false,
  image_url text,
  verdict text NOT NULL,
  confidence numeric NOT NULL,
  reasons text[] NOT NULL DEFAULT '{}'::text[],
  tips text[] NOT NULL DEFAULT '{}'::text[],
  model_breakdown jsonb,
  manipulation jsonb,
  file_name text NOT NULL DEFAULT 'image',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Users can manage their own reports"
ON public.shared_reports
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Public can view shared reports
CREATE POLICY "Anyone can view public reports"
ON public.shared_reports
FOR SELECT
TO anon, authenticated
USING (is_public = true);
