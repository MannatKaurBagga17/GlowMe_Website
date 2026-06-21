DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role; GRANT CREATE ON SCHEMA public TO service_role;

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

CREATE TYPE public.booking_status AS ENUM ('pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.location_type AS ENUM ('studio', 'at_home');
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
  location_type public.location_type NOT NULL,
  address TEXT, city TEXT,
  customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL,
  total_paise BIGINT NOT NULL, paid_paise BIGINT NOT NULL DEFAULT 0,
  is_advance BOOLEAN NOT NULL DEFAULT false,
  status public.booking_status NOT NULL DEFAULT 'pending_payment',
  cancellation_reason TEXT, cancelled_at TIMESTAMPTZ,
  artist_response TEXT, artist_response_note TEXT, responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer reads own bookings" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "customer inserts own bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "customer updates own bookings" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "artist owner reads bookings" ON public.bookings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = bookings.artist_id AND a.owner_id = auth.uid()));
CREATE POLICY "artist owner updates bookings" ON public.bookings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = bookings.artist_id AND a.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = bookings.artist_id AND a.owner_id = auth.uid()));
CREATE POLICY "admins manage bookings" ON public.bookings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX bookings_customer_idx ON public.bookings(customer_id);
CREATE INDEX bookings_artist_idx ON public.bookings(artist_id);

CREATE TABLE public.booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_paise BIGINT NOT NULL
);
GRANT SELECT, INSERT ON public.booking_services TO authenticated;
GRANT ALL ON public.booking_services TO service_role;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read booking services" ON public.booking_services FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_services.booking_id AND (b.customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.artists a WHERE a.id = b.artist_id AND a.owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "insert booking services" ON public.booking_services FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_services.booking_id AND b.customer_id = auth.uid()));

CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE public.payment_method AS ENUM ('card', 'upi', 'wallet', 'cash');
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  method public.payment_method NOT NULL,
  provider_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own payments" ON public.payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = payments.booking_id AND (b.customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.artists a WHERE a.id = b.artist_id AND a.owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "customer inserts payment" ON public.payments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = payments.booking_id AND b.customer_id = auth.uid()));

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  artist_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reviews TO anon, authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "customer writes own review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id AND verified = false AND EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = reviews.booking_id AND b.customer_id = auth.uid() AND b.status = 'completed'));
CREATE POLICY "customer updates own review" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id AND verified = false);
CREATE POLICY "artist owner can reply to review" ON public.reviews FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = reviews.artist_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = reviews.artist_id AND a.owner_id = auth.uid()));
CREATE POLICY "admin manages reviews" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX reviews_artist_idx ON public.reviews(artist_id);

CREATE OR REPLACE FUNCTION public.recalc_artist_rating(_artist_id UUID)
RETURNS VOID LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.artists a SET
    avg_rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews r WHERE r.artist_id = _artist_id), 0),
    review_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.artist_id = _artist_id)
  WHERE a.id = _artist_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_recalc_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.recalc_artist_rating(COALESCE(NEW.artist_id, OLD.artist_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER reviews_recalc AFTER INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.tg_recalc_rating();

CREATE TABLE public.favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, artist_id)
);
GRANT SELECT, INSERT, DELETE ON public.favourites TO authenticated;
GRANT ALL ON public.favourites TO service_role;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer reads own favs" ON public.favourites FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "customer adds fav" ON public.favourites FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "customer removes fav" ON public.favourites FOR DELETE TO authenticated USING (auth.uid() = customer_id);

CREATE TYPE public.thread_status AS ENUM ('open', 'closed');
CREATE TABLE public.support_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status public.thread_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_threads TO authenticated;
GRANT ALL ON public.support_threads TO service_role;
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer reads own threads" ON public.support_threads FOR SELECT TO authenticated USING (auth.uid() = customer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "customer creates thread" ON public.support_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "customer updates own thread" ON public.support_threads FOR UPDATE TO authenticated USING (auth.uid() = customer_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = customer_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER threads_updated_at BEFORE UPDATE ON public.support_threads FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "thread participants read" ON public.support_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.support_threads t WHERE t.id = thread_id AND (t.customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "thread participants write" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND (NOT is_staff OR public.has_role(auth.uid(),'admin')) AND EXISTS (SELECT 1 FROM public.support_threads t WHERE t.id = support_messages.thread_id AND (t.customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.artist_working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '19:00',
  is_open BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (artist_id, weekday)
);
GRANT SELECT ON public.artist_working_hours TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.artist_working_hours TO authenticated;
GRANT ALL ON public.artist_working_hours TO service_role;
ALTER TABLE public.artist_working_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read working hours" ON public.artist_working_hours FOR SELECT USING (true);
CREATE POLICY "owner manages working hours" ON public.artist_working_hours FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = artist_working_hours.artist_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = artist_working_hours.artist_id AND a.owner_id = auth.uid()));

CREATE TABLE public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  method TEXT NOT NULL DEFAULT 'bank_transfer',
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','paid','rejected')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artist reads own payouts" ON public.payout_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = payout_requests.artist_id AND a.owner_id = auth.uid()));
CREATE POLICY "artist creates own payouts" ON public.payout_requests FOR INSERT TO authenticated WITH CHECK (status = 'requested' AND EXISTS (SELECT 1 FROM public.artists a WHERE a.id = payout_requests.artist_id AND a.owner_id = auth.uid()));
CREATE POLICY "admin manages payouts update" ON public.payout_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manages payouts delete" ON public.payout_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX payout_requests_artist_idx ON public.payout_requests(artist_id, created_at DESC);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_recalc_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_artist_rating(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

REVOKE SELECT (phone, email) ON public.artists FROM anon;
REVOKE SELECT (phone, email) ON public.artists FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_my_artist()
RETURNS SETOF public.artists LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.artists WHERE owner_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_artist() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_artist() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_artist_contact(_artist_id uuid)
RETURNS TABLE (phone text, email text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.artists a WHERE a.id = _artist_id AND a.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.artist_id = _artist_id AND b.customer_id = auth.uid() AND b.status IN ('confirmed','completed'))
  ) THEN RETURN; END IF;
  RETURN QUERY SELECT a.phone, a.email FROM public.artists a WHERE a.id = _artist_id;
END;
$$;
REVOKE ALL ON FUNCTION public.get_artist_contact(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_artist_contact(uuid) TO authenticated;

CREATE TABLE public.public_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 80),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.public_reviews TO anon, authenticated;
GRANT ALL ON public.public_reviews TO service_role;
ALTER TABLE public.public_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read public reviews" ON public.public_reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can submit a public review" ON public.public_reviews FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.artist_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  whatsapp text NOT NULL,
  email text NOT NULL,
  city text NOT NULL,
  area text NOT NULL,
  studio_address text NOT NULL,
  pincode text NOT NULL,
  years_experience int NOT NULL DEFAULT 0,
  specialities text[] NOT NULL DEFAULT '{}',
  services_pricing text NOT NULL,
  working_days text NOT NULL,
  working_hours text NOT NULL,
  studio_photos text,
  aadhaar_number text NOT NULL,
  address_proof text,
  portfolio_link text NOT NULL,
  work_photos text,
  bank_account text NOT NULL,
  ifsc text NOT NULL,
  upi_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.artist_applications TO anon, authenticated;
GRANT ALL ON public.artist_applications TO service_role;
ALTER TABLE public.artist_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit an artist application" ON public.artist_applications FOR INSERT TO anon, authenticated WITH CHECK (true);