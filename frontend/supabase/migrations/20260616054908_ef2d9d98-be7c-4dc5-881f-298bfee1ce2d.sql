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
  cancellation_policy_snapshot TEXT NOT NULL, notes TEXT,
  cancelled_at TIMESTAMPTZ, cancellation_reason TEXT,
  refund_paise BIGINT NOT NULL DEFAULT 0,
  artist_response TEXT CHECK (artist_response IN ('accepted','rejected')),
  artist_response_note TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer reads own bookings" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = customer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "customer creates booking" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "customer updates own booking" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = customer_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = customer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "artist reads own bookings" ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = bookings.artist_id AND a.owner_id = auth.uid()));
CREATE POLICY "artist updates own bookings" ON public.bookings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = bookings.artist_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = bookings.artist_id AND a.owner_id = auth.uid()));
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX bookings_customer_idx ON public.bookings(customer_id, starts_at DESC);
CREATE INDEX bookings_artist_idx ON public.bookings(artist_id, starts_at);

CREATE TABLE public.booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  title_snapshot TEXT NOT NULL, price_paise BIGINT NOT NULL, duration_minutes INTEGER NOT NULL
);
GRANT SELECT, INSERT ON public.booking_items TO authenticated;
GRANT ALL ON public.booking_items TO service_role;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items follow booking read" ON public.booking_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "items follow booking insert" ON public.booking_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid()));
CREATE POLICY "artist reads booking items" ON public.booking_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b JOIN public.artists a ON a.id = b.artist_id
                  WHERE b.id = booking_items.booking_id AND a.owner_id = auth.uid()));

CREATE TYPE public.payment_status AS ENUM ('created', 'paid', 'failed', 'refunded', 'partial_refund');
CREATE TYPE public.payment_kind AS ENUM ('advance', 'final', 'full', 'refund');
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.payment_kind NOT NULL,
  amount_paise BIGINT NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'created',
  razorpay_order_id TEXT, razorpay_payment_id TEXT, method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer reads own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = customer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "customer inserts own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "artist reads booking payments" ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b JOIN public.artists a ON a.id = b.artist_id
                  WHERE b.id = payments.booking_id AND a.owner_id = auth.uid()));

CREATE POLICY "artist reads booking customer profiles" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b JOIN public.artists a ON a.id = b.artist_id
                  WHERE b.customer_id = profiles.id AND a.owner_id = auth.uid()));

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT, body TEXT,
  artist_reply TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
);
GRANT SELECT (id, artist_id, booking_id, rating, title, body, artist_reply, verified, created_at) ON public.reviews TO anon, authenticated;
GRANT INSERT, DELETE ON public.reviews TO authenticated;
GRANT UPDATE (title, body, rating, artist_reply) ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "customer writes own review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id AND EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid() AND b.status = 'completed'));
CREATE POLICY "customer updates own review" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "customer deletes own review" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "artist replies to own reviews" ON public.reviews FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = reviews.artist_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = reviews.artist_id AND a.owner_id = auth.uid()));
CREATE INDEX reviews_artist_idx ON public.reviews(artist_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.recalc_artist_rating(_artist_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.artists a SET
    avg_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE artist_id = _artist_id), 0),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE artist_id = _artist_id)
  WHERE a.id = _artist_id;
END;
$$;
CREATE OR REPLACE FUNCTION public.tg_recalc_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
CREATE POLICY "thread participants write" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.support_threads t WHERE t.id = thread_id AND (t.customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

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
CREATE POLICY "artist creates own payouts" ON public.payout_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.artists a WHERE a.id = payout_requests.artist_id AND a.owner_id = auth.uid()));
CREATE INDEX payout_requests_artist_idx ON public.payout_requests(artist_id, created_at DESC);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_recalc_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_artist_rating(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;