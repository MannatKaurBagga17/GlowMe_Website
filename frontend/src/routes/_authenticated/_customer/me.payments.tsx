import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { CustomerShell } from "@/components/customer/customer-shell";
import { listMyBookings } from "@/lib/glowme.functions";
import { formatINR, formatDateTime } from "@/lib/format";
import { CreditCard } from "lucide-react";

const bookingsQO = queryOptions({ queryKey: ["my-bookings"], queryFn: () => listMyBookings() });

export const Route = createFileRoute("/_authenticated/_customer/me/payments")({
  head: () => ({ meta: [{ title: "Payments — GlowMe" }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(bookingsQO); },
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{String(error?.message ?? error)}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: PaymentsPage,
});

function PaymentsPage() {
  const { data } = useSuspenseQuery(bookingsQO);
  const paid = data.bookings.filter((b: any) => b.paid_paise > 0);
  return (
    <CustomerShell title="Payments">
      {paid.length === 0 ? (
        <div className="rounded-2xl border border-primary/15 bg-card/60 p-8 text-center backdrop-blur-xl">
          <CreditCard className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">No payment history yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paid.map((b: any) => (
            <div key={b.id} className="rounded-2xl border border-primary/15 bg-card/60 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{b.artists?.name}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(b.starts_at)}</div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-lg text-primary">{formatINR(b.paid_paise)}</div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{b.status.replace("_", " ")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CustomerShell>
  );
}