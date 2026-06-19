import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listArtists, listCities } from "@/lib/glowme.functions";
import { SiteHeader } from "@/components/site-header";
import { formatINR } from "@/lib/format";
import { Star, MapPin, Search, Filter, BadgeCheck } from "lucide-react";

const citiesQO = queryOptions({ queryKey: ["cities"], queryFn: () => listCities() });

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Find a makeup, hair or nail artist — GlowMe" },
      { name: "description", content: "Discover verified beauty professionals in India. Filter by city, service, price, and rating." },
      { property: "og:title", content: "Find your perfect beauty artist — GlowMe" },
      { property: "og:description", content: "Verified makeup, hair, and nail artists. At-home or studio." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(citiesQO);
  },
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{String(error?.message ?? error)}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: SearchPage,
});

function SearchPage() {
  const { data: cityData } = useSuspenseQuery(citiesQO);
  const [city, setCity] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [query, setQuery] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [atHome, setAtHome] = useState(false);
  const [studio, setStudio] = useState(false);

  const filters = { city: city || undefined, category: category || undefined, query: query || undefined, minRating: minRating || undefined, maxPrice: maxPrice || undefined, atHome: atHome || undefined, studio: studio || undefined };
  const { data, isFetching } = useQuery({
    queryKey: ["artists", filters],
    queryFn: () => listArtists({ data: filters }),
  });

  const artists = data?.artists ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-gradient-to-b from-rose-50/60 to-background py-10">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="font-serif text-3xl tracking-tight md:text-4xl">Discover India's finest beauty artists</h1>
          <p className="mt-2 text-muted-foreground">Verified makeup, hair, nails, skincare. At-home or studio.</p>

          <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm" placeholder="Artist name" />
            </div>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">All cities</option>
              {cityData.cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">All services</option>
              <option value="makeup">Makeup</option>
              <option value="hair">Hair</option>
              <option value="nails">Nails</option>
              <option value="skincare">Skincare</option>
              <option value="mehndi">Mehndi</option>
              <option value="package">Packages</option>
            </select>
            <details className="rounded-md border border-input bg-background">
              <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-sm"><Filter className="h-4 w-4" /> Filters</summary>
              <div className="space-y-3 p-3 text-sm">
                <label className="block">Min rating: {minRating || "any"}
                  <input type="range" min={0} max={5} step={0.5} value={minRating} onChange={(e) => setMinRating(+e.target.value)} className="mt-1 w-full" />
                </label>
                <label className="block">Max price: {maxPrice ? formatINR(maxPrice) : "any"}
                  <input type="range" min={0} max={2500000} step={50000} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="mt-1 w-full" />
                </label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={atHome} onChange={(e) => setAtHome(e.target.checked)} /> At-home service</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={studio} onChange={(e) => setStudio(e.target.checked)} /> Studio service</label>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-4 text-sm text-muted-foreground">
          {isFetching ? "Searching…" : `${artists.length} artist${artists.length === 1 ? "" : "s"}`}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((a) => (
            <Link key={a.id} to="/artist/$slug" params={{ slug: a.slug }} className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-lg">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                {a.hero_image_url && <img src={a.hero_image_url} alt={a.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />}
                {a.verified && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> Verified</span>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-lg">{a.name}</h3>
                    <p className="text-sm text-muted-foreground">{a.tagline}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {Number(a.avg_rating).toFixed(1)}
                    <span className="text-muted-foreground">({a.review_count})</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {a.area ? `${a.area}, ` : ""}{a.city}</span>
                  <span>from <strong>{formatINR(a.base_price_paise)}</strong></span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.specialties?.slice(0, 3).map((s) => <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{s}</span>)}
                </div>
              </div>
            </Link>
          ))}
        </div>
        {!isFetching && artists.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No artists match these filters. Try widening your search.
          </div>
        )}
      </section>
    </div>
  );
}
