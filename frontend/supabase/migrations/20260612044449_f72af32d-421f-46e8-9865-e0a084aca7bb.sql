
CREATE POLICY "public read artist-media"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'artist-media');

CREATE POLICY "owners upload artist-media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'artist-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "owners update artist-media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'artist-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "owners delete artist-media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'artist-media' AND auth.uid()::text = (storage.foldername(name))[1]);
