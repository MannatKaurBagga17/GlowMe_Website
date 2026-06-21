import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArtistShell } from "@/components/artist/artist-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMyArtist } from "@/lib/artist-dashboard.functions";
import { updateServiceAreas } from "@/lib/artist-workspace.functions";
import { Field } from "@/components/artist/form-helpers";

export const Route = createFileRoute("/_authenticated/_artist/service-areas")({
  component: ServiceAreasPage,
});

const CITIES = ["Chandigarh", "Ludhiana", "Bangalore"];

function ServiceAreasPage() {
  const qc = useQueryClient();
  const fetchMine = useServerFn(getMyArtist);
  const save = useServerFn(updateServiceAreas);
  const { data } = useQuery({ queryKey: ["my-artist"], queryFn: () => fetchMine() });
  const a = data?.artist;
  const [form, setForm] = useState({ city: CITIES[0], area: "", service_radius_km: 15, offers_at_home: false, offers_studio: true });

  useEffect(() => { if (a) setForm({ city: a.city ?? CITIES[0], area: a.area ?? "", service_radius_km: a.service_radius_km ?? 15, offers_at_home: false, offers_studio: a.offers_studio }); }, [a?.id]);

  const mut = useMutation({
    mutationFn: () => save({ data: { ...form, area: form.area || null } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["my-artist"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  if (!a) return <ArtistShell title="Service Areas"><Card className="p-5 text-muted-foreground">Create your profile first.</Card></ArtistShell>;

  return (
    <ArtistShell title="Service Areas">
      <Card className="space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="City">
            <Select value={form.city} onValueChange={v => setForm({ ...form, city: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Area / Neighborhood"><Input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} /></Field>
          <Field label="Service radius (km)"><Input type="number" min={1} max={200} value={form.service_radius_km} onChange={e => setForm({ ...form, service_radius_km: Number(e.target.value) })} /></Field>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.offers_studio} onCheckedChange={v => setForm({ ...form, offers_studio: v })} /> Studio Service</label>
        </div>
        <div className="flex justify-end"><Button onClick={() => mut.mutate()} disabled={mut.isPending}>Save</Button></div>
      </Card>
    </ArtistShell>
  );
}
