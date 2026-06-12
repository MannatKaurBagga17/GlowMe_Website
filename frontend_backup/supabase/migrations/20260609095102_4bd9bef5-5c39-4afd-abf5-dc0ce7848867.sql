REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_recalc_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_artist_rating(UUID) FROM PUBLIC, anon, authenticated;
-- has_role is used inside RLS policies, so authenticated must still execute it
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;