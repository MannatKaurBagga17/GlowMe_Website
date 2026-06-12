import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useSuspenseQuery, queryOptions, useMutation } from "@tanstack/react-query";
import { getArtistBySlug, toggleFavourite } from "@/lib/glowme.functions";
import { SiteHeader } from "@/components/site-header";
import { formatINR } from "@/lib/format";
import { Star, MapPin, BadgeCheck, Clock, Heart, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ServiceModeModal, type ServiceMode } from "@/components/service-mode-modal";

const artistQO = (slug: string) =>
  queryOptions({ queryKey: ["artist", slug], queryFn: () => getArtistBySlug({ data: { slug } }) });

export const Route = createFileRoute("/artist/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(artistQO(params.slug));
    if (!data.artist) throw notFound();
  },
  head: ({ loaderData, params }) => {
    void loaderData;
    return {
      meta: [
        { title: `Artist — ${params.slug} | GlowMe` },
        { name: "description", content: `Book this verified beauty artist on GlowMe.` },
      ],
    };
  },
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{String(error?.message ?? error)}</div>,
  notFoundComponent: () => <div className="p-8">Artist not found</div>,
  component: ArtistPage,
});

function ArtistPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(artistQO(slug));
  const navigate = useNavigate();
  const artist = data.artist!;
  const [cart, setCart] = useState<string[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [fav, setFav] = useState(false);
  const [modeModal, setModeModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  const favMut = useMutation({
    mutationFn: () => toggleFavourite({ data: { artistId: artist.id } }),
    onSuccess: (r) => setFav(r.favourited),
  });

  function toggle(id: string) {
    setCart((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  const cartTotal = data.services.filter((s) => cart.includes(s.id)).reduce((sum, s) => sum + Number(s.price_paise), 0);
  const cartDuration = data.services.filter((s) => cart.includes(s.id)).reduce((sum, s) => sum + s.duration_minutes, 0);

  function proceed() {
    if (!signedIn) {
      navigate({ to: "/auth" });
      return;
    }
    if (cart.length === 0) return;
    setModeModal(true);
  }

  function continueWithMode(mode: ServiceMode) {
    setModeModal(false);
    const params = new URLSearchParams({ services: cart.join(","), mode });
    navigate({ to: `/booking/${artist.id}?${params.toString()}` as never });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <ServiceModeModal
        open={modeModal}
        onClose={() => setModeModal(false)}
        onSelect={continueWithMode}
        artistName={artist.name}
        studioAddress={artist.area ? `${artist.area}, ${artist.city}` : artist.city}
        offersAtHome={artist.offers_at_home}
        offersStudio={artist.offers_studio}
      />


      <div className="relative h-72 w-full overflow-hidden bg-muted md:h-96">
        {artist.hero_image_url && <img src={artist.hero_image_url} alt={artist.name} className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      <div className="mx-auto -mt-20 max-w-6xl px-4">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:flex md:items-center md:gap-6">
          {artist.avatar_url && <img src={artist.avatar_url} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-background" />}
          <div className="mt-4 flex-1 md:mt-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-3xl">{artist.name}</h1>
              {artist.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
            </div>
            <p className="text-muted-foreground">{artist.tagline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {Number(artist.avg_rating).toFixed(1)} ({artist.review_count} reviews)</span>
              <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" /> {artist.area}, {artist.city}</span>
              <span className="text-muted-foreground">{artist.years_experience}+ years experience</span>
            </div>
          </div>
          {signedIn && (
            <button onClick={() => favMut.mutate()} className={`mt-4 flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm md:mt-0 ${fav ? "bg-rose-50 text-rose-600" : ""}`}>
              <Heart className={`h-4 w-4 ${fav ? "fill-rose-500" : ""}`} /> {fav ? "Saved" : "Save"}
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          {/* About */}
          <section>
            <h2 className="font-serif text-2xl">About</h2>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">{artist.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {artist.specialties?.map((s: string) => <span key={s} className="rounded-full bg-secondary px-3 py-1 text-xs">{s}</span>)}
            </div>
          </section>

          {/* Services */}
          <section>
            <h2 className="font-serif text-2xl">Services</h2>
            <div className="mt-4 space-y-3">
              {data.services.map((s) => {
                const inCart = cart.includes(s.id);
                return (
                  <div key={s.id} className={`rounded-xl border p-4 transition ${inCart ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{s.title}</h3>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs uppercase tracking-wide">{s.category}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.duration_minutes} min</span>
                          {s.available_at_home && <span>At-home ✓</span>}
                          {s.available_at_studio && <span>Studio ✓</span>}
                        </div>
                        {s.products_used && <p className="mt-2 text-xs text-muted-foreground"><strong>Products:</strong> {s.products_used}</p>}
                        {s.inclusions?.length > 0 && (
                          <ul className="mt-2 grid gap-0.5 text-xs text-muted-foreground sm:grid-cols-2">
                            {s.inclusions.map((i: string) => <li key={i}>· {i}</li>)}
                          </ul>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <strong className="text-lg">{formatINR(s.price_paise)}</strong>
                        <button onClick={() => toggle(s.id)} className={`rounded-md px-3 py-1.5 text-sm ${inCart ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"}`}>
                          {inCart ? "Added" : "Add"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Portfolio */}
          <section>
            <h2 className="font-serif text-2xl">Portfolio</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.portfolio.map((p) => (
                <div key={p.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
                  <img src={p.url} alt={p.caption ?? ""} className="h-full w-full object-cover transition hover:scale-105" loading="lazy" />
                </div>
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section>
            <h2 className="font-serif text-2xl">Reviews</h2>
            {data.reviews.length === 0 ? (
              <p className="mt-3 text-muted-foreground">No reviews yet — be the first.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {data.reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />)}</div>
                      {r.verified && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Verified booking</span>}
                    </div>
                    {r.title && <h4 className="mt-2 font-medium">{r.title}</h4>}
                    {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Policy */}
          <section className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Cancellation policy:</strong> {artist.cancellation_policy}
          </section>
        </div>

        {/* Sticky booking card */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><ShoppingBag className="h-4 w-4" /> Your selection</div>
            {cart.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Add services to continue.</p>
            ) : (
              <>
                <ul className="mt-3 space-y-2 text-sm">
                  {data.services.filter((s) => cart.includes(s.id)).map((s) => (
                    <li key={s.id} className="flex justify-between"><span>{s.title}</span><span>{formatINR(s.price_paise)}</span></li>
                  ))}
                </ul>
                <div className="my-3 h-px bg-border" />
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Duration</span><span>{cartDuration} min</span></div>
                <div className="flex justify-between font-medium"><span>Total</span><span>{formatINR(cartTotal)}</span></div>
              </>
            )}
            <button disabled={cart.length === 0} onClick={proceed} className="mt-4 w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {signedIn ? "Choose date & time" : "Sign in to book"}
            </button>
            <Link to="/support" className="mt-2 block text-center text-xs text-muted-foreground hover:text-foreground">Need help? Chat with support</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
