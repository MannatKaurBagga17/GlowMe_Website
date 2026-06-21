
-- 1) Fix storage policies for artist-media bucket: disambiguate `name` so it
-- refers to the storage object path, not artists.name.
DROP POLICY IF EXISTS "artist-media owner insert" ON storage.objects;
DROP POLICY IF EXISTS "artist-media owner update" ON storage.objects;
DROP POLICY IF EXISTS "artist-media owner delete" ON storage.objects;

CREATE POLICY "artist-media owner insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'artist-media'
    AND EXISTS (
      SELECT 1 FROM public.artists a
      WHERE a.owner_id = auth.uid()
        AND (storage.foldername(storage.objects.name))[1] = a.id::text
    )
  );

CREATE POLICY "artist-media owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'artist-media'
    AND (
      public.has_role(auth.uid(),'admin')
      OR EXISTS (
        SELECT 1 FROM public.artists a
        WHERE a.owner_id = auth.uid()
          AND (storage.foldername(storage.objects.name))[1] = a.id::text
      )
    )
  );

CREATE POLICY "artist-media owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'artist-media'
    AND (
      public.has_role(auth.uid(),'admin')
      OR EXISTS (
        SELECT 1 FROM public.artists a
        WHERE a.owner_id = auth.uid()
          AND (storage.foldername(storage.objects.name))[1] = a.id::text
      )
    )
  );

-- 2) Strip phone/email from the public-readable columns on artists.
-- Re-apply column-level revokes after any broad GRANT SELECT.
REVOKE SELECT (phone, email) ON public.artists FROM anon;
REVOKE SELECT (phone, email) ON public.artists FROM authenticated;

-- 3) Lock down public_reviews: only authenticated users may post, only their
-- own row, and require non-empty validated content. Drop the wide-open policy.
DROP POLICY IF EXISTS "Anyone can submit a public review" ON public.public_reviews;

ALTER TABLE public.public_reviews
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

REVOKE INSERT ON public.public_reviews FROM anon;
GRANT INSERT ON public.public_reviews TO authenticated;

CREATE POLICY "Authenticated users submit their own review"
  ON public.public_reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id = auth.uid()
    AND rating BETWEEN 1 AND 5
    AND char_length(btrim(author_name)) BETWEEN 1 AND 80
    AND char_length(btrim(body)) BETWEEN 1 AND 1000
  );
