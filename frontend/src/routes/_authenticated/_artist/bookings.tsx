import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArtistShell } from "@/components/artist/artist-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { listArtistBookings, respondToBooking } from "@/lib/artist-dashboard.functions";

export const Route = createFileRoute("/_authenticated/_artist/bookings")({
  component: BookingsPage,
});

function BookingsPage() {
  const qc = useQueryClient();
  const fetchBk = useServerFn(listArtistBookings);
  const respond = useServerFn(respondToBooking);
  const { data, isLoading } = useQuery({ queryKey: ["artist-bookings"], queryFn: () => fetchBk() });
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");

  const mut = useMutation({
    mutationFn: (vars: { id: string; action: "accepted" | "rejected"; note?: string }) => respond({ data: vars }),
    onSuccess: () => {
      toast.success("Booking updated"); setNoteFor(null); setNote("");
      qc.invalidateQueries({ queryKey: ["artist-bookings"] });
      qc.invalidateQueries({ queryKey: ["artist-overview"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const bookings = data?.bookings ?? [];
  const filtered = bookings.filter((b: any) => {
    if (filter === "all") return true;
    if (filter === "pending") return b.status === "pending_payment" || (b.status === "confirmed" && !b.artist_response);
    return b.status === filter;
  });

  return (
    <ArtistShell title="Bookings">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              onClick={() => setFilter(f)}
              className={
                "capitalize border " +
                (filter === f
                  ? "bg-[#d4af37] text-black border-[#d4af37] hover:bg-[#e6c34a]"
                  : "bg-transparent text-[#d4af37] border-[#d4af37]/40 hover:bg-[#d4af37]/10 hover:text-[#d4af37]")
              }
            >
              {f}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <Card className="p-5 bg-black/60 border-[#d4af37]/30 text-[#d4af37]/80">Loading…</Card>
        ) : filtered.length === 0 ? (
          <Card className="p-5 bg-black/60 border-[#d4af37]/30 text-[#d4af37]/80">No bookings in this view.</Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map((b: any) => {
              const needsAction = b.status === "pending_payment" || (b.status === "confirmed" && !b.artist_response);
              return (
                <Card key={b.id} className="p-4 space-y-2 bg-black/60 border-[#d4af37]/30 text-[#f5e6b8]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{b.customer_name ?? "Customer"} <span className="text-sm text-muted-foreground">· {b.customer_phone ?? ""}</span></div>
                      <div className="text-sm text-muted-foreground">{new Date(b.starts_at).toLocaleString()} · {b.location_type} · {b.city}</div>
                      {b.address && <div className="text-xs text-muted-foreground">{b.address}</div>}
                      {b.notes && <div className="text-xs italic mt-1">"{b.notes}"</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">₹{Math.round(Number(b.total_paise) / 100).toLocaleString()}</div>
                      <Badge variant={b.artist_response === "accepted" ? "default" : b.artist_response === "rejected" ? "destructive" : "secondary"}>
                        {b.artist_response === "accepted" ? "Accepted"
                          : b.artist_response === "rejected" ? "Declined"
                          : b.status === "completed" ? "Completed"
                          : b.status === "cancelled" ? "Cancelled"
                          : "Pending"}
                      </Badge>
                    </div>
                  </div>
                  {b.artist_response_note && <div className="text-xs text-muted-foreground">Your note: {b.artist_response_note}</div>}
                  {needsAction && noteFor !== b.id && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => mut.mutate({ id: b.id, action: "accepted" })} disabled={mut.isPending}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => { setNoteFor(b.id); setNote(""); }}>Reject</Button>
                    </div>
                  )}
                  {noteFor === b.id && (
                    <div className="space-y-2 pt-1">
                      <Textarea rows={2} placeholder="Optional reason (shown to customer)" value={note} onChange={(e) => setNote(e.target.value)} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => mut.mutate({ id: b.id, action: "rejected", note: note || undefined })} disabled={mut.isPending}>Confirm decline</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setNoteFor(null); setNote(""); }}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ArtistShell>
  );
}
