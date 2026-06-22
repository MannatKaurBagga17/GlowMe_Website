import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArtistShell } from "@/components/artist/artist-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_artist/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <ArtistShell title="Settings">
      <div className="space-y-4 max-w-xl">
        <Card className="p-5">
          <h2 className="font-semibold">Account</h2>
          <div className="mt-2 text-sm text-muted-foreground">Signed in as <span className="text-foreground">{email ?? "…"}</span></div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Sign out</h2>
          <p className="text-sm text-muted-foreground mt-1">End your session on this device.</p>
          <Button variant="outline" className="mt-3" onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
        </Card>
      </div>
    </ArtistShell>
  );
}
