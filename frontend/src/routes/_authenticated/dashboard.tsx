import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Upload, Image as ImgIcon, Video } from "lucide-react";
import {
  getMyArtist,
  upsertMyArtist,
  saveService,
  deleteService,
  addPortfolio,
  deletePortfolio,
} from "@/lib/artist-dashboard.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const CITIES = ["Chandigarh", "Ludhiana", "Bangalore"];
const CATEGORIES = ["makeup", "hair", "mehndi", "nails", "skincare", "package"] as const;

function DashboardPage() {
  const fetchMine = useServerFn(getMyArtist);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-artist"], queryFn: () => fetchMine() });

  const upsert = useServerFn(upsertMyArtist);
  const saveSvc = useServerFn(saveService);
  const delSvc = useServerFn(deleteService);
  const addPf = useServerFn(addPortfolio);
  const delPf = useServerFn(deletePortfolio);

  const artist = data?.artist;
  const services = data?.services ?? [];
  const portfolio = data?.portfolio ?? [];

  // ---- Profile form state ----
  const [form, setForm] = useState({
    name: "", phone: "", email: "", city: CITIES[0], area: "",
    tagline: "", bio: "", years_experience: 0,
    languages: "", specialties: "",
    base_price_paise: 0, avatar_url: "", hero_image_url: "",
    offers_at_home: true, offers_studio: true, service_radius_km: 15,
  });

  useEffect(() => {
    if (artist) {
      setForm({
        name: artist.name ?? "",
        phone: artist.phone ?? "",
        email: artist.email ?? "",
        city: artist.city ?? CITIES[0],
        area: artist.area ?? "",
        tagline: artist.tagline ?? "",
        bio: artist.bio ?? "",
        years_experience: artist.years_experience ?? 0,
        languages: (artist.languages ?? []).join(", "),
        specialties: (artist.specialties ?? []).join(", "),
        base_price_paise: artist.base_price_paise ?? 0,
        avatar_url: artist.avatar_url ?? "",
        hero_image_url: artist.hero_image_url ?? "",
        offers_at_home: artist.offers_at_home,
        offers_studio: artist.offers_studio,
        service_radius_km: artist.service_radius_km ?? 15,
      });
    }
  }, [artist?.id]);

  const profileMut = useMutation({
    mutationFn: () => upsert({
      data: {
        name: form.name, phone: form.phone, email: form.email,
        city: form.city, area: form.area || null,
        tagline: form.tagline || null, bio: form.bio || null,
        years_experience: Number(form.years_experience) || 0,
        languages: form.languages.split(",").map(s => s.trim()).filter(Boolean),
        specialties: form.specialties.split(",").map(s => s.trim()).filter(Boolean),
        base_price_paise: Number(form.base_price_paise) || 0,
        avatar_url: form.avatar_url || null,
        hero_image_url: form.hero_image_url || null,
        offers_at_home: form.offers_at_home,
        offers_studio: form.offers_studio,
        service_radius_km: Number(form.service_radius_km) || 15,
      },
    }),
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["my-artist"] }); },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  async function uploadFile(file: File, folder: "avatars" | "hero" | "portfolio") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sign in required"); return null; }
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("artist-media").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return null; }
    const { data: pub } = supabase.storage.from("artist-media").getPublicUrl(path);
    return pub.publicUrl;
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background"><SiteHeader /><div className="mx-auto max-w-5xl p-6 text-muted-foreground">Loading…</div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-6 p-4 pt-6 md:p-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl">Artist Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {artist ? <>Public page: <Link to="/artist/$slug" params={{ slug: artist.slug }} className="underline">/artist/{artist.slug}</Link></> : "Create your profile to start receiving bookings."}
            </p>
          </div>
          {artist && <Badge variant={artist.verified ? "default" : "secondary"}>{artist.verified ? "Verified" : "Pending verification"}</Badge>}
        </header>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="services" disabled={!artist}>Services</TabsTrigger>
            <TabsTrigger value="portfolio" disabled={!artist}>Portfolio</TabsTrigger>
          </TabsList>

          {/* PROFILE */}
          <TabsContent value="profile">
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
                <Field label="Area / Locality"><Input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} /></Field>
                <Field label="Years of experience"><Input type="number" min={0} value={form.years_experience} onChange={e => setForm({ ...form, years_experience: Number(e.target.value) })} /></Field>
                <Field label="Tagline"><Input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="One-line headline" /></Field>
                <Field label="Base price (₹)"><Input type="number" min={0} value={Math.round(form.base_price_paise / 100)} onChange={e => setForm({ ...form, base_price_paise: Number(e.target.value) * 100 })} /></Field>
                <Field label="Languages (comma separated)"><Input value={form.languages} onChange={e => setForm({ ...form, languages: e.target.value })} placeholder="English, Hindi, Punjabi" /></Field>
                <Field label="Specializations (comma separated)"><Input value={form.specialties} onChange={e => setForm({ ...form, specialties: e.target.value })} placeholder="Bridal, Party, HD Makeup" /></Field>
              </div>
              <Field label="Bio"><Textarea rows={4} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></Field>

              <div className="grid gap-4 md:grid-cols-2">
                <ImageUpload label="Profile photo" url={form.avatar_url} onChange={u => setForm({ ...form, avatar_url: u })} upload={f => uploadFile(f, "avatars")} />
                <ImageUpload label="Cover / hero photo" url={form.hero_image_url} onChange={u => setForm({ ...form, hero_image_url: u })} upload={f => uploadFile(f, "hero")} />
              </div>

              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-3 text-sm font-semibold">Service area</h3>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={form.offers_at_home} onCheckedChange={v => setForm({ ...form, offers_at_home: v })} /> Home / Venue Service
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={form.offers_studio} onCheckedChange={v => setForm({ ...form, offers_studio: v })} /> Studio Service
                  </label>
                  <div className="flex items-center gap-2 text-sm">
                    <Label>Radius (km)</Label>
                    <Input type="number" className="w-24" min={1} max={200} value={form.service_radius_km} onChange={e => setForm({ ...form, service_radius_km: Number(e.target.value) })} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => profileMut.mutate()} disabled={profileMut.isPending}>
                  {profileMut.isPending ? "Saving…" : artist ? "Save changes" : "Create profile"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* SERVICES */}
          <TabsContent value="services">
            <ServicesTab
              services={services}
              onSave={async (s) => { await saveSvc({ data: s as any }); toast.success("Service saved"); qc.invalidateQueries({ queryKey: ["my-artist"] }); }}
              onDelete={async (id) => { await delSvc({ data: { id } }); toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["my-artist"] }); }}
            />
          </TabsContent>

          {/* PORTFOLIO */}
          <TabsContent value="portfolio">
            <PortfolioTab
              items={portfolio}
              upload={uploadFile}
              onAdd={async (p) => { await addPf({ data: p }); toast.success("Added"); qc.invalidateQueries({ queryKey: ["my-artist"] }); }}
              onDelete={async (id) => { await delPf({ data: { id } }); toast.success("Removed"); qc.invalidateQueries({ queryKey: ["my-artist"] }); }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}

function ImageUpload({ label, url, onChange, upload }: { label: string; url: string; onChange: (u: string) => void; upload: (f: File) => Promise<string | null> }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-3">
        {url ? <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground"><ImgIcon className="h-6 w-6" /></div>}
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="outline" type="button" onClick={() => ref.current?.click()} disabled={busy}>
            <Upload className="mr-1.5 h-4 w-4" />{busy ? "Uploading…" : "Upload"}
          </Button>
          {url && <Button size="sm" variant="ghost" type="button" onClick={() => onChange("")}>Remove</Button>}
        </div>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          setBusy(true); const u = await upload(f); setBusy(false);
          if (u) onChange(u);
          if (ref.current) ref.current.value = "";
        }} />
      </div>
    </div>
  );
}

type SvcForm = {
  id?: string; category: typeof CATEGORIES[number]; title: string; description: string;
  duration_minutes: number; price_paise: number; inclusions: string[];
  available_at_home: boolean; available_at_studio: boolean; active: boolean;
};
const EMPTY_SVC: SvcForm = { category: "makeup", title: "", description: "", duration_minutes: 60, price_paise: 0, inclusions: [], available_at_home: true, available_at_studio: true, active: true };

function ServicesTab({ services, onSave, onDelete }: { services: any[]; onSave: (s: SvcForm) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [editing, setEditing] = useState<SvcForm | null>(null);
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Services ({services.length})</h2>
        <Button size="sm" onClick={() => setEditing({ ...EMPTY_SVC })}><Plus className="mr-1 h-4 w-4" /> New service</Button>
      </div>
      {services.length === 0 && !editing && <p className="text-sm text-muted-foreground">No services yet. Add your first service so customers can book.</p>}
      <div className="grid gap-3">
        {services.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2"><span className="font-medium">{s.title}</span><Badge variant="secondary">{s.category}</Badge>{!s.active && <Badge variant="outline">Inactive</Badge>}</div>
              <div className="text-sm text-muted-foreground">{s.duration_minutes} min · ₹{Math.round(Number(s.price_paise) / 100).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing({
                id: s.id, category: s.category, title: s.title, description: s.description,
                duration_minutes: s.duration_minutes, price_paise: Number(s.price_paise),
                inclusions: s.inclusions ?? [], available_at_home: s.available_at_home,
                available_at_studio: s.available_at_studio, active: s.active,
              })}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this service?")) onDelete(s.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="space-y-3 rounded-lg border border-primary/30 bg-muted/30 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Title *"><Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Category">
              <Select value={editing.category} onValueChange={(v: any) => setEditing({ ...editing, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Duration (min)"><Input type="number" min={15} value={editing.duration_minutes} onChange={e => setEditing({ ...editing, duration_minutes: Number(e.target.value) })} /></Field>
            <Field label="Price (₹)"><Input type="number" min={0} value={Math.round(editing.price_paise / 100)} onChange={e => setEditing({ ...editing, price_paise: Number(e.target.value) * 100 })} /></Field>
          </div>
          <Field label="Description"><Textarea rows={3} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} /></Field>
          <Field label="Add-ons / inclusions (comma separated)">
            <Input value={editing.inclusions.join(", ")} onChange={e => setEditing({ ...editing, inclusions: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="HD Makeup, False lashes, Hair styling" />
          </Field>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <label className="flex items-center gap-2"><Switch checked={editing.available_at_home} onCheckedChange={v => setEditing({ ...editing, available_at_home: v })} /> At Home</label>
            <label className="flex items-center gap-2"><Switch checked={editing.available_at_studio} onCheckedChange={v => setEditing({ ...editing, available_at_studio: v })} /> At Studio</label>
            <label className="flex items-center gap-2"><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /> Active</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={async () => { await onSave(editing); setEditing(null); }}>Save</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function PortfolioTab({ items, upload, onAdd, onDelete }: {
  items: any[];
  upload: (f: File, folder: "avatars" | "hero" | "portfolio") => Promise<string | null>;
  onAdd: (p: { kind: "photo" | "video"; url: string; caption?: string | null; sort_order: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Portfolio ({items.length})</h2>
        <Button size="sm" onClick={() => ref.current?.click()} disabled={busy}><Upload className="mr-1 h-4 w-4" />{busy ? "Uploading…" : "Upload photo / video"}</Button>
        <input ref={ref} type="file" accept="image/*,video/*" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          setBusy(true);
          const url = await upload(f, "portfolio");
          if (url) await onAdd({ kind: f.type.startsWith("video/") ? "video" : "photo", url, caption: null, sort_order: items.length });
          setBusy(false);
          if (ref.current) ref.current.value = "";
        }} />
      </div>
      {items.length === 0 && <p className="text-sm text-muted-foreground">No portfolio items yet.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map(it => (
          <div key={it.id} className="group relative overflow-hidden rounded-lg border border-border">
            {it.kind === "video" ? (
              <video src={it.url} className="aspect-square w-full object-cover" muted playsInline />
            ) : (
              <img src={it.url} alt={it.caption ?? ""} className="aspect-square w-full object-cover" />
            )}
            <div className="absolute left-2 top-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] uppercase">
              {it.kind === "video" ? <Video className="inline h-3 w-3" /> : <ImgIcon className="inline h-3 w-3" />}
            </div>
            <button onClick={() => { if (confirm("Delete this item?")) onDelete(it.id); }}
              className="absolute right-2 top-2 rounded bg-destructive/90 p-1 text-destructive-foreground opacity-0 transition group-hover:opacity-100">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
