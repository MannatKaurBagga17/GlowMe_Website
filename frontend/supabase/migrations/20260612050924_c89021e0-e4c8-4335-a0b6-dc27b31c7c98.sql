-- Hide customer_id from public reads on reviews
REVOKE SELECT ON public.reviews FROM anon, authenticated;
GRANT SELECT (id, artist_id, booking_id, rating, title, body, verified, created_at) ON public.reviews TO anon, authenticated;
-- INSERT/UPDATE/DELETE still need to operate on customer_id (RLS enforces self)
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;