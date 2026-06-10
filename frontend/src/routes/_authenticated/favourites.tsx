import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listFavourites } from "@/lib/glowme.functions";
import { SiteHeader } from "@/components/site-header";
import { formatINR } from "@/lib/format";
import { Star, Heart } from "lucide-react";

const favQO = queryOptions({ queryKey: ["my-favourites"], queryFn: () => listFavourites() });

export const Route = createFileRoute("/_authenticated/favourites")({
  head: () => ({ meta: [{ title: "Saved artists — GlowMe" }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(favQO); },
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{String(error?.message ?? error)}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: Favourites,
});

function Favourites() {
  const { data } = useSuspenseQuery(favQO);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-serif text-3xl">Saved artists</h1>
        {data.favourites.length === 0 ? (
          <p className="mt-4 text-muted-foreground">Tap the <Heart className="inline h-4 w-4" /> on any artist to save them here.</p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.favourites.map((f: any) => {
              const a = f.artists;
              if (!a) return null;
              return (
                <Link key={f.artist_id} to="/artist/$slug" params={{ slug: a.slug }} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-lg">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-muted">{a.hero_image_url && <img src={a.hero_image_url} alt={a.name} className="h-full w-full object-cover" />}</div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div><h3 className="font-serif text-lg">{a.name}</h3><p className="text-sm text-muted-foreground">{a.tagline}</p></div>
                      <span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {Number(a.avg_rating).toFixed(1)}</span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{a.city} · from {formatINR(a.base_price_paise)}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
