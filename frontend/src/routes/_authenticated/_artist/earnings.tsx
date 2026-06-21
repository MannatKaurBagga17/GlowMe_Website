import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArtistShell } from "@/components/artist/artist-shell";
import { Card } from "@/components/ui/card";
import { getEarningsBreakdown } from "@/lib/artist-workspace.functions";

export const Route = createFileRoute("/_authenticated/_artist/earnings")({
  component: EarningsPage,
});

function EarningsPage() {
  const fetchEarn = useServerFn(getEarningsBreakdown);
  const { data, isLoading } = useQuery({ queryKey: ["earnings"], queryFn: () => fetchEarn() });

  if (isLoading) return <ArtistShell title="Earnings"><div className="text-muted-foreground">Loading…</div></ArtistShell>;

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  return (
    <ArtistShell title="Earnings">
      <div className="space-y-4">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Total earnings (lifetime)</div>
          <div className="mt-1 font-serif text-4xl">₹{Math.round(total / 100).toLocaleString()}</div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold mb-3">By month</h2>
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">No earnings yet.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="pb-2">Month</th><th className="pb-2 text-right">Amount</th></tr></thead>
              <tbody>{rows.map((r: any) => (
                <tr key={r.month} className="border-t border-border"><td className="py-2">{r.month}</td><td className="py-2 text-right">₹{Math.round(r.paise / 100).toLocaleString()}</td></tr>
              ))}</tbody>
            </table>
          )}
        </Card>
      </div>
    </ArtistShell>
  );
}
