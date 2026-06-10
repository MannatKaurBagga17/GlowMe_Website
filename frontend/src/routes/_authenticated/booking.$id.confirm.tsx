import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getBooking } from "@/lib/glowme.functions";
import { SiteHeader } from "@/components/site-header";
import { formatINR, formatDateTime } from "@/lib/format";
import { CheckCircle2, Calendar, MessageCircle } from "lucide-react";

const bookingQO = (id: string) => queryOptions({ queryKey: ["booking", id], queryFn: () => getBooking({ data: { id } }) });

export const Route = createFileRoute("/_authenticated/booking/$id/confirm")({
  head: () => ({ meta: [{ title: "Booking confirmed — GlowMe" }] }),
  loader: ({ params, context }) => { context.queryClient.ensureQueryData(bookingQO(params.id)); },
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{String(error?.message ?? error)}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: Confirm,
});

function Confirm() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(bookingQO(id));
  const b = data.booking;
  if (!b) return <div className="p-8">Booking not found.</div>;

  const waMessage = encodeURIComponent(`Hi! I have a GlowMe booking on ${formatDateTime(b.starts_at)} with ${b.artists?.name}.`);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h1 className="mt-4 font-serif text-3xl">You're booked!</h1>
          <p className="mt-2 text-muted-foreground">A confirmation has been saved to your account. We'll send a reminder before your appointment.</p>

          <div className="mt-6 rounded-xl border border-border bg-background p-4 text-left text-sm">
            <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Artist</span><span className="font-medium">{b.artists?.name}</span></div>
            <div className="flex justify-between border-b border-border py-2"><span className="text-muted-foreground">When</span><span className="font-medium">{formatDateTime(b.starts_at)}</span></div>
            <div className="flex justify-between border-b border-border py-2"><span className="text-muted-foreground">Where</span><span className="font-medium">{b.location_type === "studio" ? "Artist's studio" : b.address}</span></div>
            <div className="flex justify-between border-b border-border py-2"><span className="text-muted-foreground">Services</span>
              <span className="text-right font-medium">{b.booking_items?.map((i) => i.title_snapshot).join(", ")}</span>
            </div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Paid</span><span className="font-medium">{formatINR(b.paid_paise)} of {formatINR(b.total_paise)}</span></div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to="/account" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Calendar className="h-4 w-4" /> View bookings</Link>
            <a href={`https://wa.me/?text=${waMessage}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"><MessageCircle className="h-4 w-4" /> Share on WhatsApp</a>
          </div>

          <p className="mt-6 text-xs text-muted-foreground"><strong>Cancellation:</strong> {b.artists?.cancellation_policy}</p>
        </div>
      </div>
    </div>
  );
}
