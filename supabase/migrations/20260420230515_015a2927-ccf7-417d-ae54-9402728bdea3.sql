-- Remove the broad SELECT policy that allows anyone to list all files
-- in the scan-images bucket via the storage API.
-- Direct public URL access (used by Winston AI, shared reports, OG previews,
-- and PDF export) continues to work because the bucket remains public —
-- the public CDN path does not require an RLS SELECT policy.
DROP POLICY IF EXISTS "Anyone can view scan images" ON storage.objects;