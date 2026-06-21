import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_customer")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: artist } = await supabase.from("artists").select("id").eq("owner_id", u.user.id).maybeSingle();
    if (artist) throw redirect({ to: "/dashboard" });
  },
  component: () => <Outlet />,
});
