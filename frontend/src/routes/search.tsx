import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listArtists, listCities } from "@/lib/glowme.functions";
import { SiteHeader } from "@/components/site-header";
import { formatINR } from "@/lib/format";
import { Star, MapPin, Search, Filter, BadgeCheck } from "lucide-react";

const citiesQO = queryOptions({ queryKey: ["cities"], queryFn: () => listCities() });
const supportedCities = ["Chandigarh", "Ludhiana", "Bangalore"];

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Find a makeup, hair or nail artist — GlowMe" },
      { name: "description", content: "Discover verified beauty professionals in India. Filter by city, service, price, and rating." },
      { property: "og:title", content: "Find your perfect beauty artist — GlowMe" },
      { property: "og:description", content: "Verified makeup, hair, and nail artists. At-home or studio." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@200;300;400;500&display=swap",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(citiesQO);
  },
  errorComponent: ({ error }) => <div className="p-8" style={{ background: "#080808", color: "#E89A8A", minHeight: "100vh" }}>{String(error?.message ?? error)}</div>,
  notFoundComponent: () => <div className="p-8" style={{ background: "#080808", color: "#F5F0E8", minHeight: "100vh" }}>Not found</div>,
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
  const cities = Array.from(new Set([...supportedCities, ...(cityData.cities ?? [])])).sort();

  return (
    <div className="gm-search-root">
      <style>{`
        .gm-search-root{
          --black:#080808;--off-black:#111010;--dark:#1A1714;--gold:#C9A96E;--gold-light:#E8D5A3;--gold-dark:#9A7A45;
          --cream:#F5F0E8;--muted:#8A7D70;--line:rgba(201,169,110,0.18);
          --dp:'Playfair Display',serif;--cg:'Cormorant Garamond',serif;--body:'Jost',sans-serif;
          min-height:100vh;background:var(--black);color:var(--cream);font-family:var(--body);font-weight:300;
          position:relative;
        }
        .gm-search-root::before{
          content:'';position:fixed;inset:0;background:
            radial-gradient(circle at 15% 10%,rgba(201,169,110,0.10),transparent 45%),
            radial-gradient(circle at 85% 90%,rgba(154,122,69,0.08),transparent 50%);
          pointer-events:none;z-index:0;
        }
        .gm-search-root > *{position:relative;z-index:1;}
        .gm-hero{border-bottom:0.5px solid var(--line);padding:72px 0 44px;background:linear-gradient(180deg,rgba(26,23,20,0.4),transparent);}
        .gm-eyebrow{font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:var(--gold);margin-bottom:14px;display:flex;align-items:center;gap:12px;}
        .gm-eyebrow::before{content:'';display:block;width:24px;height:0.5px;background:var(--gold);}
        .gm-h1{font-family:var(--dp);font-size:clamp(32px,5vw,52px);font-weight:400;line-height:1.05;color:var(--cream);margin:0 0 14px;letter-spacing:-0.01em;}
        .gm-h1 em{font-style:italic;color:var(--gold);}
        .gm-sub{font-family:var(--cg);font-size:18px;line-height:1.5;color:rgba(245,240,232,0.6);margin:0;}
        .gm-filter-bar{margin-top:32px;display:grid;gap:10px;grid-template-columns:1fr;background:rgba(17,16,16,0.7);border:0.5px solid var(--line);padding:16px;backdrop-filter:blur(10px);}
        @media(min-width:900px){.gm-filter-bar{grid-template-columns:1.4fr 1fr 0.9fr auto;}}
        .gm-input,.gm-select{width:100%;background:rgba(8,8,8,0.6);border:0.5px solid var(--line);color:var(--cream);padding:12px 14px;font-family:var(--body);font-size:13px;letter-spacing:0.02em;outline:none;transition:all .25s;}
        .gm-input::placeholder{color:rgba(245,240,232,0.35);letter-spacing:0.05em;}
        .gm-input:focus,.gm-select:focus{border-color:var(--gold);background:rgba(8,8,8,0.85);box-shadow:0 0 0 3px rgba(201,169,110,0.08);}
        .gm-select option{background:#111010;color:var(--cream);}
        .gm-input-icon{position:relative;}
        .gm-input-icon svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--gold);}
        .gm-input-icon .gm-input{padding-left:40px;}
        .gm-loc{display:grid;grid-template-columns:1fr auto;gap:6px;}
        .gm-filters-toggle{display:flex;align-items:center;gap:8px;background:rgba(8,8,8,0.6);border:0.5px solid var(--line);color:var(--gold);padding:12px 16px;font-family:var(--body);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;}
        .gm-filters-toggle:hover{background:var(--gold);color:var(--black);}
        .gm-filters-panel{margin-top:10px;background:rgba(8,8,8,0.6);border:0.5px solid var(--line);padding:18px;display:grid;gap:14px;font-size:13px;color:var(--cream);}
        .gm-filters-panel label{display:block;color:rgba(245,240,232,0.75);font-size:12px;letter-spacing:0.05em;}
        .gm-filters-panel input[type=range]{width:100%;accent-color:var(--gold);margin-top:6px;}
        .gm-filters-panel input[type=checkbox]{accent-color:var(--gold);margin-right:8px;}
        .gm-count{color:var(--muted);font-size:11px;letter-spacing:0.22em;text-transform:uppercase;margin:32px 0 20px;}
        .gm-grid{display:grid;gap:24px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));}
        .gm-card{display:block;background:linear-gradient(180deg,rgba(26,23,20,0.85),rgba(17,16,16,0.95));border:0.5px solid var(--line);overflow:hidden;text-decoration:none;color:var(--cream);transition:all .35s;}
        .gm-card:hover{border-color:rgba(201,169,110,0.45);transform:translateY(-2px);box-shadow:0 20px 50px -20px rgba(0,0,0,0.7);}
        .gm-card-img{position:relative;aspect-ratio:4/3;overflow:hidden;background:#0d0d0d;}
        .gm-card-img img{width:100%;height:100%;object-fit:cover;transition:transform .6s;filter:saturate(0.95);}
        .gm-card:hover .gm-card-img img{transform:scale(1.05);}
        .gm-verified{position:absolute;left:12px;top:12px;display:inline-flex;align-items:center;gap:6px;background:rgba(8,8,8,0.85);border:0.5px solid var(--gold);color:var(--gold);padding:5px 10px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;backdrop-filter:blur(8px);}
        .gm-card-body{padding:20px;}
        .gm-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
        .gm-card-name{font-family:var(--dp);font-size:20px;font-weight:400;color:var(--cream);margin:0 0 4px;letter-spacing:0.01em;}
        .gm-card-tag{font-family:var(--cg);font-size:14px;color:rgba(245,240,232,0.55);margin:0;font-style:italic;}
        .gm-rating{display:flex;align-items:center;gap:4px;font-size:13px;color:var(--gold);white-space:nowrap;}
        .gm-rating .num{color:var(--cream);}
        .gm-rating .cnt{color:var(--muted);font-size:11px;}
        .gm-card-meta{margin-top:14px;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:rgba(245,240,232,0.6);letter-spacing:0.03em;}
        .gm-card-meta .loc{display:inline-flex;align-items:center;gap:5px;}
        .gm-card-meta strong{color:var(--gold);font-weight:500;font-family:var(--dp);font-size:14px;}
        .gm-chips{margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;}
        .gm-chip{font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:var(--gold);border:0.5px solid var(--line);padding:4px 10px;background:rgba(201,169,110,0.05);}
        .gm-empty{border:0.5px dashed var(--line);padding:60px 20px;text-align:center;color:var(--muted);font-family:var(--cg);font-size:16px;letter-spacing:0.03em;margin-top:24px;}
        .gm-container{max-width:1280px;margin:0 auto;padding:0 24px;}
      `}</style>

      <SiteHeader />

      <section className="gm-hero">
        <div className="gm-container">
          <div className="gm-eyebrow">The Directory</div>
          <h1 className="gm-h1">Discover India's <em>finest</em> beauty artists</h1>
          <p className="gm-sub">Verified makeup, hair, nails & skincare. At-home or studio.</p>

          <div className="gm-filter-bar">
            <div className="gm-input-icon">
              <Search className="h-4 w-4" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="gm-input" placeholder="Artist name" />
            </div>
            <div className="gm-loc">
              <input value={city} onChange={(e) => setCity(e.target.value)} list="glowme-city-options" className="gm-input" placeholder="Search location" />
              <select value={city} onChange={(e) => setCity(e.target.value)} className="gm-select" aria-label="Choose city" style={{ width: "auto" }}>
                <option value="">All</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <datalist id="glowme-city-options">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="gm-select">
              <option value="">All services</option>
              <option value="makeup">Makeup</option>
              <option value="hair">Hair</option>
              <option value="nails">Nails</option>
              <option value="skincare">Skincare</option>
              <option value="mehndi">Mehndi</option>
              <option value="package">Packages</option>
            </select>
            <details>
              <summary className="gm-filters-toggle" style={{ listStyle: "none" }}>
                <Filter className="h-3.5 w-3.5" /> Filters
              </summary>
              <div className="gm-filters-panel">
                <label>Min rating: <span style={{ color: "var(--gold)" }}>{minRating || "any"}</span>
                  <input type="range" min={0} max={5} step={0.5} value={minRating} onChange={(e) => setMinRating(+e.target.value)} />
                </label>
                <label>Max price: <span style={{ color: "var(--gold)" }}>{maxPrice ? formatINR(maxPrice) : "any"}</span>
                  <input type="range" min={0} max={2500000} step={50000} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} />
                </label>
                <label><input type="checkbox" checked={atHome} onChange={(e) => setAtHome(e.target.checked)} /> At-home service</label>
                <label><input type="checkbox" checked={studio} onChange={(e) => setStudio(e.target.checked)} /> Studio service</label>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section className="gm-container" style={{ padding: "0 24px 80px" }}>
        <div className="gm-count">
          {isFetching ? "Searching…" : `${artists.length} artist${artists.length === 1 ? "" : "s"}`}
        </div>
        <div className="gm-grid">
          {artists.map((a) => (
            <Link key={a.id} to="/artist/$slug" params={{ slug: a.slug }} className="gm-card">
              <div className="gm-card-img">
                {a.hero_image_url && <img src={a.hero_image_url} alt={a.name} loading="lazy" />}
                {a.verified && <span className="gm-verified"><BadgeCheck className="h-3 w-3" /> Verified</span>}
              </div>
              <div className="gm-card-body">
                <div className="gm-card-top">
                  <div>
                    <h3 className="gm-card-name">{a.name}</h3>
                    <p className="gm-card-tag">{a.tagline}</p>
                  </div>
                  <div className="gm-rating">
                    <Star className="h-3.5 w-3.5" fill="currentColor" />
                    <span className="num">{Number(a.avg_rating).toFixed(1)}</span>
                    <span className="cnt">({a.review_count})</span>
                  </div>
                </div>
                <div className="gm-card-meta">
                  <span className="loc"><MapPin className="h-3 w-3" /> {a.area ? `${a.area}, ` : ""}{a.city}</span>
                  <span>from <strong>{formatINR(a.base_price_paise)}</strong></span>
                </div>
                <div className="gm-chips">
                  {a.specialties?.slice(0, 3).map((s) => <span key={s} className="gm-chip">{s}</span>)}
                </div>
              </div>
            </Link>
          ))}
        </div>
        {!isFetching && artists.length === 0 && (
          <div className="gm-empty">No artists match these filters. Try widening your search.</div>
        )}
      </section>
    </div>
  );
}
