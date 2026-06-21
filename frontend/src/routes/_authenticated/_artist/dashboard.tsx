import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArtistShell } from "@/components/artist/artist-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Clock, AlertCircle, Wallet, Star, Bell } from "lucide-react";
import { getArtistOverview, listRecentActivity } from "@/lib/artist-workspace.functions";

export const Route = createFileRoute("/_authenticated/_artist/dashboard")({
  component: DashboardOverview,
});

function Stat({ icon: Icon, label, value, hint }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </Card>
  );
}

function DashboardOverview() {
  const fetchOverview = useServerFn(getArtistOverview);
  const fetchActivity = useServerFn(listRecentActivity);
  const { data, isLoading } = useQuery({ queryKey: ["artist-overview"], queryFn: () => fetchOverview() });
  const { data: act } = useQuery({ queryKey: ["artist-activity"], queryFn: () => fetchActivity() });

  if (isLoading) return <ArtistShell title="Dashboard"><div className="text-muted-foreground">Loading…</div></ArtistShell>;

  if (!data?.artist) {
    return (
      <ArtistShell title="Dashboard">
        <Card className="p-6">
          <h2 className="font-serif text-2xl">Welcome 👋</h2>
          <p className="mt-2 text-muted-foreground">Create your artist profile to start receiving bookings.</p>
          <Link to="/profile" className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Create profile</Link>
        </Card>
      </ArtistShell>
    );
  }

  const t = data.totals!;
  const upcoming = data.upcoming ?? [];

  return (
    <ArtistShell title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-3xl">Welcome back, {data.artist.name}</h2>
          <p className="text-sm text-muted-foreground">Here's what's happening with your business.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat icon={CalendarCheck} label="Total Bookings" value={t.bookings} />
          <Stat icon={Clock} label="Upcoming" value={t.upcoming} />
          <Stat icon={AlertCircle} label="Pending Requests" value={t.pending} hint={t.pending > 0 ? "Action needed" : "All clear"} />
          <Stat icon={Wallet} label="Earnings (this month)" value={`₹${Math.round(t.earningsPaise / 100).toLocaleString()}`} />
          <Stat icon={Star} label="Average Rating" value={`${t.avgRating.toFixed(1)} ★`} hint={`${t.reviewCount} reviews`} />
          <Stat icon={Bell} label="Profile" value={data.artist.verified ? "Verified" : "Pending"} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Upcoming Appointments</h3>
              <Link to="/bookings" className="text-xs text-primary">View all →</Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No upcoming appointments.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {upcoming.map((b: any) => (
                  <li key={b.id} className="flex justify-between rounded-md border border-border p-2 text-sm">
                    <div>
                      <div className="font-medium">{b.customer_name ?? "Customer"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(b.starts_at).toLocaleString()}</div>
                    </div>
                    <Badge variant="secondary">{b.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Recent Activity</h3>
              <Link to="/notifications" className="text-xs text-primary">View all →</Link>
            </div>
            {(act?.items?.length ?? 0) === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {act!.items.slice(0, 6).map((i: any) => (
                  <li key={`${i.kind}-${i.id}`} className="rounded-md border border-border p-2 text-sm">
                    <div>{i.text}</div>
                    <div className="text-xs text-muted-foreground">{new Date(i.at).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </ArtistShell>
  );
}
