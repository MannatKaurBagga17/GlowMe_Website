import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArtistShell } from "@/components/artist/artist-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { getMyArtist, saveService, deleteService } from "@/lib/artist-dashboard.functions";
import { Field } from "@/components/artist/form-helpers";

export const Route = createFileRoute("/_authenticated/_artist/services")({
  component: ServicesPage,
});

const CATEGORIES = ["makeup", "hair", "mehndi", "nails", "skincare", "package"] as const;
type Cat = typeof CATEGORIES[number];
type Form = {
  id?: string; category: Cat; title: string; description: string;
  duration_minutes: number; price_paise: number; inclusions: string[];
  available_at_home: boolean; available_at_studio: boolean; active: boolean;
};
const EMPTY: Form = { category: "makeup", title: "", description: "", duration_minutes: 60, price_paise: 0, inclusions: [], available_at_home: false, available_at_studio: true, active: true };

function ServicesPage() {
  const qc = useQueryClient();
  const fetchMine = useServerFn(getMyArtist);
  const save = useServerFn(saveService);
  const del = useServerFn(deleteService);
  const { data } = useQuery({ queryKey: ["my-artist"], queryFn: () => fetchMine() });
  const services = data?.services ?? [];
  const [editing, setEditing] = useState<Form | null>(null);

  return (
    <ArtistShell title="Services & Pricing">
      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Services ({services.length})</h2>
          <Button size="sm" onClick={() => setEditing({ ...EMPTY })}><Plus className="mr-1 h-4 w-4" />New service</Button>
        </div>
        {services.length === 0 && !editing && <p className="text-sm text-muted-foreground">Add your first service so customers can book.</p>}
        <div className="grid gap-3">
          {services.map((s: any) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
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
                <Button size="sm" variant="ghost" onClick={async () => {
                  if (!confirm("Delete?")) return;
                  await del({ data: { id: s.id } });
                  toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["my-artist"] });
                }}><Trash2 className="h-4 w-4" /></Button>
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
            <Field label="Inclusions (comma separated)">
              <Input value={editing.inclusions.join(", ")} onChange={e => setEditing({ ...editing, inclusions: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
            </Field>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <label className="flex items-center gap-2"><Switch checked={editing.available_at_studio} onCheckedChange={v => setEditing({ ...editing, available_at_studio: v })} /> At Studio</label>
              <label className="flex items-center gap-2"><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /> Active</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={async () => {
                await save({ data: editing as any });
                toast.success("Saved"); setEditing(null);
                qc.invalidateQueries({ queryKey: ["my-artist"] });
              }}>Save</Button>
            </div>
          </div>
        )}
      </Card>
    </ArtistShell>
  );
}
