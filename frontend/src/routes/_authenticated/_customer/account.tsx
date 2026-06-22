import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyBookings, cancelBooking, createReview } from "@/lib/glowme.functions";
import { CustomerShell } from "@/components/customer/customer-shell";
import { formatINR, formatDateTime } from "@/lib/format";
import { useState } from "react";
import { Star } from "lucide-react";

const bookingsQO = queryOptions({ queryKey: ["my-bookings"], queryFn: () => listMyBookings() });

export const Route = createFileRoute("/_authenticated/_customer/account")({
  head: () => ({ meta: [{ title: "My bookings — GlowMe" }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(bookingsQO); },
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{String(error?.message ?? error)}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: AccountPage,
});

function AccountPage() {
  const { data } = useSuspenseQuery(bookingsQO);
  const qc = useQueryClient();

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelBooking({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-bookings"] }),
  });

  const upcoming = data.bookings.filter((b) => ["pending_payment", "confirmed"].includes(b.status));
  const past = data.bookings.filter((b) => !["pending_payment", "confirmed"].includes(b.status));

  return (
    <CustomerShell title="My Bookings">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-serif text-3xl">Your bookings</h1>

        <section className="mt-8">
          <h2 className="font-medium">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No upcoming bookings. <Link to="/search" className="text-primary">Find an artist →</Link></p>
          ) : (
            <div className="mt-3 space-y-3">
              {upcoming.map((b) => (
                <BookingCard key={b.id} b={b} onCancel={() => cancelMut.mutate(b.id)} cancelling={cancelMut.isPending} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-medium">Past</h2>
          {past.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No past bookings yet.</p>
          ) : (
            <div className="mt-3 space-y-3">{past.map((b) => <PastCard key={b.id} b={b} />)}</div>
          )}
        </section>
      </div>
    </CustomerShell>
  );
}

function BookingCard({ b, onCancel, cancelling }: { b: any; onCancel: () => void; cancelling: boolean }) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-card/60 p-4 backdrop-blur-xl transition hover:border-primary/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><h3 className="font-medium">{b.artists?.name}</h3>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{b.status.replace("_", " ")}</span>
          </div>
          <p className="text-sm text-muted-foreground">{formatDateTime(b.starts_at)}</p>
          <p className="text-sm text-muted-foreground">{b.location_type === "studio" ? "At studio" : `At ${b.address}`}</p>
          <ul className="mt-2 text-xs text-muted-foreground">{b.booking_items?.map((i: any) => <li key={i.id}>· {i.title_snapshot}</li>)}</ul>
        </div>
        <div className="text-right">
          <div className="text-sm">Paid <strong>{formatINR(b.paid_paise)}</strong> / {formatINR(b.total_paise)}</div>
          <Link to="/artist/$slug" params={{ slug: b.artists?.slug ?? "" }} className="mt-1 block text-xs text-primary">View artist →</Link>
          <button onClick={onCancel} disabled={cancelling} className="mt-2 rounded-md border border-border px-3 py-1 text-xs hover:bg-accent disabled:opacity-50">
            {cancelling ? "…" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PastCard({ b }: { b: any }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const reviewMut = useMutation({
    mutationFn: () => createReview({ data: { bookingId: b.id, rating, title: title || undefined, body: body || undefined } }),
    onSuccess: () => { setOpen(false); qc.invalidateQueries({ queryKey: ["artist"] }); },
  });
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{b.artists?.name}</h3>
          <p className="text-sm text-muted-foreground">{formatDateTime(b.starts_at)} · <span className="capitalize">{b.status.replace("_", " ")}</span></p>
        </div>
        <div className="flex gap-2">
          <Link to="/artist/$slug" params={{ slug: b.artists?.slug ?? "" }} search={{ rebook: (b.booking_items ?? []).map((i: any) => i.service_id).filter(Boolean).join(",") || undefined }} className="rounded-md border border-border px-3 py-1 text-xs">Book again</Link>
          {b.status === "completed" && <button onClick={() => setOpen(!open)} className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground">{open ? "Cancel" : "Review"}</button>}
        </div>
      </div>
      {open && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <div className="flex gap-1">{[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setRating(n)}><Star className={`h-5 w-5 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} /></button>)}</div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Your experience" rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <button onClick={() => reviewMut.mutate()} disabled={reviewMut.isPending} className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">{reviewMut.isPending ? "…" : "Submit review"}</button>
        </div>
      )}
    </div>
  );
}
