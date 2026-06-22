
-- 1) Artists: revoke phone/email column SELECT from anon and authenticated.
REVOKE SELECT (phone, email) ON public.artists FROM anon;
REVOKE SELECT (phone, email) ON public.artists FROM authenticated;

-- Owner full-row access via SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.get_my_artist()
RETURNS SETOF public.artists
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.artists WHERE owner_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_artist() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_artist() TO authenticated;

-- Customer-with-booking can read an artist's contact
CREATE OR REPLACE FUNCTION public.get_artist_contact(_artist_id uuid)
RETURNS TABLE (phone text, email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.artists a WHERE a.id = _artist_id AND a.owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.artist_id = _artist_id AND b.customer_id = auth.uid()
        AND b.status IN ('confirmed','completed')
    )
  ) THEN
    RETURN;
  END IF;
  RETURN QUERY SELECT a.phone, a.email FROM public.artists a WHERE a.id = _artist_id;
END;
$$;
REVOKE ALL ON FUNCTION public.get_artist_contact(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_artist_contact(uuid) TO authenticated;

-- 2) payout_requests: lock status on insert; admin update/delete
DROP POLICY IF EXISTS "artist creates own payouts" ON public.payout_requests;
CREATE POLICY "artist creates own payouts" ON public.payout_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    status = 'requested'
    AND EXISTS (
      SELECT 1 FROM public.artists a
      WHERE a.id = payout_requests.artist_id AND a.owner_id = auth.uid()
    )
  );

CREATE POLICY "admin manages payouts update" ON public.payout_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "admin manages payouts delete" ON public.payout_requests
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 3) reviews: enforce verified=false on customer insert; admin update for verified flag
DROP POLICY IF EXISTS "customer writes own review" ON public.reviews;
CREATE POLICY "customer writes own review" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = customer_id
    AND verified = false
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = reviews.booking_id
        AND b.customer_id = auth.uid()
        AND b.status = 'completed'
    )
  );

DROP POLICY IF EXISTS "customer updates own review" ON public.reviews;
CREATE POLICY "customer updates own review" ON public.reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id AND verified = false);

CREATE POLICY "admin manages reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4) support_messages: prevent customers setting is_staff=true
DROP POLICY IF EXISTS "thread participants write" ON public.support_messages;
CREATE POLICY "thread participants write" ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (NOT is_staff OR public.has_role(auth.uid(),'admin'))
    AND EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id
        AND (t.customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
    )
  );

-- 5) storage.objects policies for artist-media bucket
CREATE POLICY "artist-media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artist-media');

CREATE POLICY "artist-media owner insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'artist-media'
    AND EXISTS (
      SELECT 1 FROM public.artists a
      WHERE a.owner_id = auth.uid()
        AND (storage.foldername(name))[1] = a.id::text
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
          AND (storage.foldername(name))[1] = a.id::text
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
          AND (storage.foldername(name))[1] = a.id::text
      )
    )
  );
