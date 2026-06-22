import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArtistShell } from "@/components/artist/artist-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMyArtist, upsertMyArtist } from "@/lib/artist-dashboard.functions";
import { Field, ImageUpload } from "@/components/artist/form-helpers";

export const Route = createFileRoute("/_authenticated/_artist/profile")({
  component: ProfilePage,
});

const CITIES = ["Chandigarh", "Ludhiana", "Bangalore"];

function ProfilePage() {
  const qc = useQueryClient();
  const fetchMine = useServerFn(getMyArtist);
  const upsert = useServerFn(upsertMyArtist);
  const { data, isLoading } = useQuery({ queryKey: ["my-artist"], queryFn: () => fetchMine() });
  const artist = data?.artist;

  const [form, setForm] = useState({
    name: "", phone: "", email: "", city: CITIES[0], area: "",
    tagline: "", bio: "", years_experience: 0, languages: "", specialties: "",
    base_price_paise: 0, avatar_url: "", hero_image_url: "",
    offers_at_home: true, offers_studio: true, service_radius_km: 15,
  });

  useEffect(() => {
    if (artist) setForm({
      name: artist.name ?? "", phone: artist.phone ?? "", email: artist.email ?? "",
      city: artist.city ?? CITIES[0], area: artist.area ?? "",
      tagline: artist.tagline ?? "", bio: artist.bio ?? "",
      years_experience: artist.years_experience ?? 0,
      languages: (artist.languages ?? []).join(", "),
      specialties: (artist.specialties ?? []).join(", "),
      base_price_paise: artist.base_price_paise ?? 0,
      avatar_url: artist.avatar_url ?? "", hero_image_url: artist.hero_image_url ?? "",
      offers_at_home: artist.offers_at_home, offers_studio: artist.offers_studio,
      service_radius_km: artist.service_radius_km ?? 15,
    });
  }, [artist?.id]);

  const mut = useMutation({
    mutationFn: () => upsert({ data: {
      name: form.name, phone: form.phone, email: form.email,
      city: form.city, area: form.area || null,
      tagline: form.tagline || null, bio: form.bio || null,
      years_experience: Number(form.years_experience) || 0,
      languages: form.languages.split(",").map(s => s.trim()).filter(Boolean),
      specialties: form.specialties.split(",").map(s => s.trim()).filter(Boolean),
      base_price_paise: Number(form.base_price_paise) || 0,
      avatar_url: form.avatar_url || null, hero_image_url: form.hero_image_url || null,
      offers_at_home: form.offers_at_home, offers_studio: form.offers_studio,
      service_radius_km: Number(form.service_radius_km) || 15,
    } }),
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["my-artist"] }); qc.invalidateQueries({ queryKey: ["artist-overview"] }); },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  if (isLoading) return <ArtistShell title="Profile"><div className="text-muted-foreground">Loading…</div></ArtistShell>;

  return (
    <ArtistShell title="Profile">
      <Card className="space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone *"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email *"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="City *">
            <Select value={form.city} onValueChange={v => setForm({ ...form, city: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Area"><Input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} /></Field>
          <Field label="Years experience"><Input type="number" min={0} value={form.years_experience} onChange={e => setForm({ ...form, years_experience: Number(e.target.value) })} /></Field>
          <Field label="Tagline"><Input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} /></Field>
          <Field label="Base price (₹)"><Input type="number" min={0} value={Math.round(form.base_price_paise / 100)} onChange={e => setForm({ ...form, base_price_paise: Number(e.target.value) * 100 })} /></Field>
          <Field label="Languages (comma separated)"><Input value={form.languages} onChange={e => setForm({ ...form, languages: e.target.value })} /></Field>
          <Field label="Specializations (comma separated)"><Input value={form.specialties} onChange={e => setForm({ ...form, specialties: e.target.value })} /></Field>
        </div>
        <Field label="Bio"><Textarea rows={4} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <ImageUpload label="Profile photo" url={form.avatar_url} onChange={u => setForm({ ...form, avatar_url: u })} folder="avatars" />
          <ImageUpload label="Cover photo" url={form.hero_image_url} onChange={u => setForm({ ...form, hero_image_url: u })} folder="hero" />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? "Saving…" : artist ? "Save changes" : "Create profile"}
          </Button>
        </div>
      </Card>
    </ArtistShell>
  );
}
