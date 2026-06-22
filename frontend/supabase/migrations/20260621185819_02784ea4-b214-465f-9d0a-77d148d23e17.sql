GRANT SELECT, INSERT, UPDATE, DELETE ON public.artists TO authenticated;
GRANT ALL ON public.artists TO service_role;

DROP POLICY IF EXISTS "owners manage own artist" ON public.artists;
CREATE POLICY "owners manage own artist"
ON public.artists
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());