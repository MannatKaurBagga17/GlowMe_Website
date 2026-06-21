REVOKE EXECUTE ON FUNCTION public.get_my_artist() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_artist_contact(uuid) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM authenticated, anon, PUBLIC;