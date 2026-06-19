
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS service_radius_km integer NOT NULL DEFAULT 15;

CREATE INDEX IF NOT EXISTS artists_owner_idx ON public.artists(owner_id);

-- Artists: owner can manage own row
DROP POLICY IF EXISTS "owners manage own artist" ON public.artists;
CREATE POLICY "owners manage own artist" ON public.artists
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "public read artists" ON public.artists;
CREATE POLICY "public read artists" ON public.artists
  FOR SELECT TO anon, authenticated USING (true);

-- Services: owner can manage services of their artist
DROP POLICY IF EXISTS "owners manage own services" ON public.services;
CREATE POLICY "owners manage own services" ON public.services
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = services.artist_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = services.artist_id AND a.owner_id = auth.uid()));

-- Portfolio: owner can manage portfolio of their artist
DROP POLICY IF EXISTS "owners manage own portfolio" ON public.portfolio_media;
CREATE POLICY "owners manage own portfolio" ON public.portfolio_media
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = portfolio_media.artist_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = portfolio_media.artist_id AND a.owner_id = auth.uid()));

DROP POLICY IF EXISTS "public read portfolio" ON public.portfolio_media;
CREATE POLICY "public read portfolio" ON public.portfolio_media
  FOR SELECT TO anon, authenticated USING (true);

-- Availability: owner can manage slots
DROP POLICY IF EXISTS "owners manage own availability" ON public.availability_slots;
CREATE POLICY "owners manage own availability" ON public.availability_slots
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = availability_slots.artist_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = availability_slots.artist_id AND a.owner_id = auth.uid()));
