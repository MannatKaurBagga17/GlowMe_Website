DROP POLICY IF EXISTS "public read artist-media" ON storage.objects;
DROP POLICY IF EXISTS "owners upload artist-media" ON storage.objects;
DROP POLICY IF EXISTS "owners update artist-media" ON storage.objects;
DROP POLICY IF EXISTS "owners delete artist-media" ON storage.objects;
DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role; GRANT CREATE ON SCHEMA public TO service_role;
DROP TYPE IF EXISTS public.app_role CASCADE;

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT, phone TEXT, avatar_url TEXT,
  default_address TEXT, default_city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  tagline TEXT, bio TEXT, city TEXT NOT NULL, area TEXT,
  hero_image_url TEXT, avatar_url TEXT,
  base_price_paise BIGINT NOT NULL DEFAULT 0,
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  offers_at_home BOOLEAN NOT NULL DEFAULT true,
  offers_studio BOOLEAN NOT NULL DEFAULT true,
  verified BOOLEAN NOT NULL DEFAULT false,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  years_experience INTEGER NOT NULL DEFAULT 0,
  cancellation_policy TEXT NOT NULL DEFAULT 'Free cancellation up to 24 hours before. 50% refund within 24 hours. No refund within 4 hours.',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  phone text, email text,
  languages text[] NOT NULL DEFAULT '{}'::text[],
  service_radius_km integer NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artists TO anon, authenticated;
GRANT ALL ON public.artists TO service_role;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read artists" ON public.artists FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage artists" ON public.artists FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owners manage own artist" ON public.artists FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER artists_updated_at BEFORE UPDATE ON public.artists FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX artists_city_idx ON public.artists(city);
CREATE INDEX artists_rating_idx ON public.artists(avg_rating DESC);
CREATE INDEX artists_owner_idx ON public.artists(owner_id);

CREATE TYPE public.service_category AS ENUM ('makeup', 'hair', 'nails', 'skincare', 'mehndi', 'package');
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  category public.service_category NOT NULL,
  title TEXT NOT NULL, description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL, price_paise BIGINT NOT NULL,
  products_used TEXT, inclusions TEXT[] NOT NULL DEFAULT '{}',
  available_at_home BOOLEAN NOT NULL DEFAULT true,
  available_at_studio BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read services" ON public.services FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owners manage own services" ON public.services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = services.artist_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = services.artist_id AND a.owner_id = auth.uid()));
CREATE INDEX services_artist_idx ON public.services(artist_id);
CREATE INDEX services_category_idx ON public.services(category);

CREATE TYPE public.media_kind AS ENUM ('photo', 'video', 'before_after');
CREATE TABLE public.portfolio_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  kind public.media_kind NOT NULL, url TEXT NOT NULL,
  before_url TEXT, caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portfolio_media TO anon, authenticated;
GRANT ALL ON public.portfolio_media TO service_role;
ALTER TABLE public.portfolio_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read portfolio" ON public.portfolio_media FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage portfolio" ON public.portfolio_media FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owners manage own portfolio" ON public.portfolio_media FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = portfolio_media.artist_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = portfolio_media.artist_id AND a.owner_id = auth.uid()));
CREATE INDEX portfolio_artist_idx ON public.portfolio_media(artist_id);

CREATE TYPE public.slot_status AS ENUM ('open', 'booked', 'blocked');
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
  status public.slot_status NOT NULL DEFAULT 'open',
  booking_id UUID,
  capacity INTEGER NOT NULL DEFAULT 10,
  booked_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (artist_id, starts_at)
);
GRANT SELECT ON public.availability_slots TO anon, authenticated;
GRANT ALL ON public.availability_slots TO service_role;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read slots" ON public.availability_slots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage slots" ON public.availability_slots FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owners manage own availability" ON public.availability_slots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = availability_slots.artist_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = availability_slots.artist_id AND a.owner_id = auth.uid()));
CREATE INDEX slots_artist_time_idx ON public.availability_slots(artist_id, starts_at);