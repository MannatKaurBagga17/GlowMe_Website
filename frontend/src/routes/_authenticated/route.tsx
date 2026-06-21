import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      const artistPath = ["/dashboard", "/bookings", "/availability", "/services", "/portfolio", "/service-areas", "/earnings", "/reviews", "/settings", "/profile"].some((path) => location.pathname.startsWith(path));
      throw redirect({ to: artistPath ? "/artist/auth" : "/auth" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
