ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS model_breakdown jsonb DEFAULT NULL;
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS manipulation jsonb DEFAULT NULL;