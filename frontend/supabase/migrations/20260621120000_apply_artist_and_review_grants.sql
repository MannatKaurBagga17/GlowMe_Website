-- Allow anonymous visitors to submit public reviews (policy already permits it,
-- but the GRANT was missing — causing "permission denied for table public_reviews").
GRANT INSERT ON public.public_reviews TO anon;

-- Artist applications submitted from the public "Apply as Artist" form.
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

CREATE POLICY "Anyone can submit an artist application"
  ON public.artist_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
