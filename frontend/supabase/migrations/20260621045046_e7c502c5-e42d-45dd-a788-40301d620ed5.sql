CREATE TABLE public.public_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 80),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.public_reviews TO anon;
GRANT SELECT, INSERT ON public.public_reviews TO authenticated;
GRANT ALL ON public.public_reviews TO service_role;

ALTER TABLE public.public_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public reviews"
  ON public.public_reviews FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can submit a public review"
  ON public.public_reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);