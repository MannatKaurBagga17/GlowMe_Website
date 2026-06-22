import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { CustomerShell } from "@/components/customer/customer-shell";
import { listMyBookings, listArtists, listFavourites } from "@/lib/glowme.functions";
import { formatINR, formatDateTime } from "@/lib/format";
import {
  Sparkles, Calendar, Heart, Bell, Gift, Star, TrendingUp, ArrowRight,
} from "lucide-react";

const bookingsQO = queryOptions({ queryKey: ["my-bookings"], queryFn: () => listMyBookings() });
const featuredQO = queryOptions({
  queryKey: ["featured-artists"],
  queryFn: () => listArtists({ data: {} }),
});
const favQO = queryOptions({ queryKey: ["my-favourites"], queryFn: () => listFavourites() });

export const Route = createFileRoute("/_authenticated/_customer/me/")({
  head: () => ({ meta: [{ title: "Dashboard — GlowMe" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(bookingsQO);
    context.queryClient.ensureQueryData(featuredQO);
    context.queryClient.prefetchQuery(favQO);
  },
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{String(error?.message ?? error)}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: DashboardPage,
});

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-primary/15 bg-card/60 p-5 shadow-[0_8px_30px_-12px_rgba(201,169,110,0.25)] backdrop-blur-xl transition hover:border-primary/40 hover:shadow-[0_12px_40px_-12px_rgba(201,169,110,0.45)] ${className}`}>
      {children}
    </div>
  );
}

function DashboardPage() {
  const { data: bookingsData } = useSuspenseQuery(bookingsQO);
  const { data: featuredData } = useSuspenseQuery(featuredQO);

  const upcoming = bookingsData.bookings.filter((b: any) => ["pending_payment", "confirmed"].includes(b.status));
  const recent = bookingsData.bookings.slice(0, 3);
  const featured = (featuredData.artists ?? []).slice(0, 6);
  const trending = (featuredData.artists ?? []).slice(0, 4);

  return (
    <CustomerShell title="Dashboard">
      {/* Welcome */}
      <GlassCard className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.25em]">Welcome back</span>
            </div>
            <h2 className="mt-2 font-serif text-3xl">Glow up your day ✨</h2>
            <p className="mt-1 text-sm text-muted-foreground">Discover top artists, manage your bookings, and enjoy exclusive offers.</p>
          </div>
          <Link to="/search" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Explore Artists <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Calendar} label="Upcoming" value={upcoming.length} />
        <StatCard icon={Heart} label="Favorites" value="—" hint="Saved artists" />
        <StatCard icon={Star} label="Reviews" value={bookingsData.bookings.filter((b: any) => b.status === "completed").length} hint="Eligible to review" />
        <StatCard icon={Gift} label="Offers" value={3} hint="Available today" />
      </div>

      {/* Featured Artists */}
      <Section title="Featured Artists" action={<Link to="/search" className="text-xs text-primary hover:underline">See all →</Link>}>
        {featured.length === 0 ? (
          <p className="text-sm text-muted-foreground">No artists yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((a: any) => (
              <Link key={a.id} to="/artist/$slug" params={{ slug: a.slug }}>
                <GlassCard className="group h-full !p-0 overflow-hidden">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                    {a.hero_image_url && <img src={a.hero_image_url} alt={a.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate font-serif text-lg">{a.name}</h4>
                        <p className="truncate text-xs text-muted-foreground">{a.tagline}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-xs"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{Number(a.avg_rating).toFixed(1)}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{a.city} · from {formatINR(a.base_price_paise)}</div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Upcoming bookings */}
        <Section title="Upcoming Bookings" action={<Link to="/account" className="text-xs text-primary hover:underline">View all →</Link>}>
          {upcoming.length === 0 ? (
            <GlassCard>
              <p className="text-sm text-muted-foreground">No upcoming bookings. <Link to="/search" className="text-primary">Find an artist →</Link></p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((b: any) => (
                <GlassCard key={b.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-medium">{b.artists?.name}</h4>
                      <p className="text-xs text-muted-foreground">{formatDateTime(b.starts_at)}</p>
                    </div>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">{b.status.replace("_", " ")}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </Section>

        {/* Recent activity */}
        <Section title="Recent Activity">
          {recent.length === 0 ? (
            <GlassCard><p className="text-sm text-muted-foreground">No activity yet.</p></GlassCard>
          ) : (
            <div className="space-y-3">
              {recent.map((b: any) => (
                <GlassCard key={b.id}>
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"><Calendar className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">Booking with <strong>{b.artists?.name}</strong></p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(b.starts_at)}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Trending services */}
        <Section title="Trending Services">
          <div className="grid gap-3 sm:grid-cols-2">
            {["Bridal Makeup", "Party Makeup", "HD Makeup", "Hairstyling"].map((s) => (
              <Link key={s} to="/search" search={{ q: s }} className="block">
                <GlassCard className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"><TrendingUp className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{s}</div>
                    <div className="text-xs text-muted-foreground">Top picks for you</div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </Section>

        {/* Offers & Notifications */}
        <Section title="Offers & Coupons">
          <div className="space-y-3">
            {[
              { code: "GLOW20", text: "20% off your first booking" },
              { code: "BRIDE10", text: "₹1,000 off bridal packages" },
              { code: "REFER100", text: "Refer a friend, both get ₹500" },
            ].map((o) => (
              <GlassCard key={o.code} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"><Gift className="h-4 w-4" /></div>
                  <div>
                    <div className="text-sm">{o.text}</div>
                    <div className="text-xs text-muted-foreground">Code: <span className="font-mono text-primary">{o.code}</span></div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </Section>
      </div>

      {/* Recommended */}
      <Section title="Recommended For You" action={<Link to="/search" className="text-xs text-primary hover:underline">Browse →</Link>}>
        {trending.length === 0 ? <p className="text-sm text-muted-foreground">No recommendations yet.</p> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((a: any) => (
              <Link key={a.id} to="/artist/$slug" params={{ slug: a.slug }}>
                <GlassCard className="group !p-0 overflow-hidden">
                  <div className="aspect-square w-full overflow-hidden bg-muted">
                    {a.hero_image_url && <img src={a.hero_image_url} alt={a.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                  </div>
                  <div className="p-3">
                    <div className="truncate font-serif text-sm">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.city}</div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <GlassCard>
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">You're all caught up. We'll notify you about booking updates and special offers.</p>
          </div>
        </GlassCard>
      </Section>
    </CustomerShell>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: any; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <GlassCard>
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="font-serif text-2xl">{value}</div>
          {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
        </div>
      </div>
    </GlassCard>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-xl">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}