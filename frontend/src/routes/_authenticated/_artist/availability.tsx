import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArtistShell } from "@/components/artist/artist-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { listAvailability, addAvailabilitySlot, deleteAvailabilitySlot } from "@/lib/artist-workspace.functions";

export const Route = createFileRoute("/_authenticated/_artist/availability")({
  component: AvailabilityPage,
});

function AvailabilityPage() {
  const qc = useQueryClient();
  const fetchSlots = useServerFn(listAvailability);
  const addSlot = useServerFn(addAvailabilitySlot);
  const delSlot = useServerFn(deleteAvailabilitySlot);
  const { data } = useQuery({ queryKey: ["availability"], queryFn: () => fetchSlots() });
  const [date, setDate] = useState("");
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("11:00");
  const [cap, setCap] = useState(1);

  const mut = useMutation({
    mutationFn: () => {
      const startISO = new Date(`${date}T${start}:00`).toISOString();
      const endISO = new Date(`${date}T${end}:00`).toISOString();
      return addSlot({ data: { starts_at: startISO, ends_at: endISO, capacity: cap } });
    },
    onSuccess: () => { toast.success("Slot added"); qc.invalidateQueries({ queryKey: ["availability"] }); setDate(""); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const slots = data?.slots ?? [];

  return (
    <ArtistShell title="Availability">
      <div className="space-y-4">
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Add a slot</h2>
          <div className="grid gap-3 sm:grid-cols-5">
            <div><label className="text-xs text-muted-foreground">Date</label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Start</label><Input type="time" value={start} onChange={e => setStart(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">End</label><Input type="time" value={end} onChange={e => setEnd(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Capacity</label><Input type="number" min={1} value={cap} onChange={e => setCap(Number(e.target.value))} /></div>
            <div className="flex items-end"><Button onClick={() => mut.mutate()} disabled={!date || mut.isPending}>Add</Button></div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3">Upcoming slots ({slots.length})</h2>
          {slots.length === 0 ? <p className="text-sm text-muted-foreground">No slots scheduled.</p> : (
            <div className="grid gap-2">
              {slots.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                  <div>{new Date(s.starts_at).toLocaleString()} → {new Date(s.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · cap {s.capacity}</div>
                  <Button size="sm" variant="ghost" onClick={async () => {
                    await delSlot({ data: { id: s.id } });
                    qc.invalidateQueries({ queryKey: ["availability"] });
                  }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </ArtistShell>
  );
}
