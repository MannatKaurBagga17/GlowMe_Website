
DROP POLICY IF EXISTS "Anyone can submit an artist application" ON public.artist_applications;
CREATE POLICY "Anyone can submit an artist application"
  ON public.artist_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(btrim(full_name)) BETWEEN 2 AND 120
    AND char_length(btrim(email)) BETWEEN 5 AND 200
    AND char_length(btrim(whatsapp)) BETWEEN 6 AND 20
    AND char_length(btrim(city)) BETWEEN 1 AND 80
    AND char_length(btrim(pincode)) BETWEEN 4 AND 10
  );
