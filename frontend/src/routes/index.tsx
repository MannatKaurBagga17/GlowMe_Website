import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import "@/glowme/glowme.css";
import bodyHtml from "@/glowme/body.html?raw";
import inlineJs from "@/glowme/inline.js?raw";
import { listArtists } from "@/lib/glowme.functions";
import { listPublicReviews, createPublicReview } from "@/lib/public-reviews.functions";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GlowMe — Luxury Beauty Marketplace" },
      {
        name: "description",
        content:
          "India's luxury beauty marketplace. Book verified makeup artists, salons, and nail specialists with live calendars and AI-powered recommendations.",
      },
      { property: "og:title", content: "GlowMe — Luxury Beauty Marketplace" },
      {
        property: "og:description",
        content:
          "Discover and book India's finest makeup artists, curated salons, and nail specialists.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap",
      },
    ],
  }),
  component: GlowMePage,
});

function escapeHtml(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function renderArtistCard(a: any, idx: number) {
  const price = Math.round(Number(a.base_price_paise || 0) / 100);
  const rating = Number(a.avg_rating || 0).toFixed(1);
  const reviews = Number(a.review_count || 0);
  const tags = (a.specialties ?? []).slice(0, 3).map((t: string) => `<span class="atag">${escapeHtml(t)}</span>`).join("");
  const fullStars = Math.round(Number(a.avg_rating || 0));
  const stars = "★".repeat(Math.max(0, Math.min(5, fullStars))) + "☆".repeat(Math.max(0, 5 - fullStars));
  const img = escapeHtml(a.hero_image_url || a.avatar_url || "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&fit=crop&crop=face");
  const avail = a.offers_at_home || a.offers_studio ? '<div class="artist-avail">Available today</div>' : "";
  return `
  <a href="/artist/${escapeHtml(a.slug)}" class="artist-card reveal d${(idx % 6) + 1}" style="text-decoration:none;color:inherit" data-price="${price}" data-rating="${rating}">
    <div class="artist-img">
      <img src="${img}" alt="${escapeHtml(a.name)}" loading="lazy">
      ${avail}
    </div>
    <div class="artist-info">
      <div class="artist-name-row"><span class="artist-name">${escapeHtml(a.name)}</span><div class="artist-rate">₹${price.toLocaleString()}<span>starting from</span></div></div>
      <div class="artist-loc">📍 ${escapeHtml(a.city || "")}${a.area ? ", " + escapeHtml(a.area) : ""}</div>
      <div class="artist-tags">${tags}</div>
      <div class="artist-footer">
        <div><span class="stars">${stars}</span><span class="rating-txt">${rating} (${reviews})</span></div>
        <div><span class="book-btn">View profile</span></div>
      </div>
    </div>
  </a>`;
}

function GlowMePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rvName, setRvName] = useState("");
  const [rvRating, setRvRating] = useState(5);
  const [rvBody, setRvBody] = useState("");
  const [rvBusy, setRvBusy] = useState(false);
  const [rvErr, setRvErr] = useState<string | null>(null);

  function renderReviewCard(r: { id: string; author_name: string; rating: number; body: string }, i: number) {
    const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
    const safe = (s: string) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
    return `<div class="testi-card reveal in d${(i % 3) + 1}"><div class="testi-stars">${stars}</div><p class="testi-quote">"${safe(r.body)}"</p><div class="testi-author"><div><div class="testi-name">${safe(r.author_name)}</div><div class="testi-city">Verified review</div></div></div></div>`;
  }

  async function refreshReviews() {
    try {
      const res = await listPublicReviews();
      const grid = document.getElementById("userReviewsGrid");
      if (grid) {
        grid.innerHTML = (res?.reviews ?? []).map((r, i) => renderReviewCard(r, i)).join("");
      }
    } catch {}
  }

  useEffect(() => {
    const ensureRazorpay = () =>
      new Promise<void>((resolve) => {
        if (document.querySelector('script[data-glowme="razorpay"]')) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.async = true;
        s.dataset.glowme = "razorpay";
        s.onload = () => resolve();
        s.onerror = () => resolve();
        document.head.appendChild(s);
      });

    let injected: HTMLScriptElement | null = null;
    let cancelled = false;
    ensureRazorpay().then(async () => {
      injected = document.createElement("script");
      injected.dataset.glowme = "inline";
      injected.text = inlineJs;
      document.body.appendChild(injected);
      try { document.dispatchEvent(new Event("DOMContentLoaded")); } catch {}

      // Replace the hard-coded "Featured artists" grid with live data.
      try {
        const res = await listArtists({ data: {} });
        if (cancelled) return;
        const grid = document.getElementById("artistsGrid");
        const artists = res?.artists ?? [];
        if (grid && artists.length > 0) {
          grid.innerHTML = artists.slice(0, 9).map((a, i) => renderArtistCard(a, i)).join("");
          // Re-trigger reveal animations on the new nodes
          grid.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
        }
      } catch {}

      // Wire "Write a Review" button + load existing user reviews
      const btn = document.getElementById("openReviewForm");
      if (btn) btn.addEventListener("click", () => setReviewOpen(true));
      refreshReviews();
    });

    return () => {
      cancelled = true;
      if (injected && injected.parentNode) injected.parentNode.removeChild(injected);
    };
  }, []);

  return (
    <>
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      {reviewOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setReviewOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(8,8,8,0.85)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Jost',sans-serif" }}
        >
          <div style={{ width: "100%", maxWidth: 480, background: "linear-gradient(180deg,rgba(26,23,20,0.95),rgba(17,16,16,0.98))", border: "0.5px solid rgba(201,169,110,0.35)", padding: 36, color: "#F5F0E8", position: "relative" }}>
            <button onClick={() => setReviewOpen(false)} style={{ position: "absolute", top: 14, right: 18, background: "none", border: "none", color: "#C9A96E", fontSize: 22, cursor: "pointer" }} aria-label="Close">✕</button>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: 12 }}>Share your experience</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 400, margin: "0 0 20px" }}>Write a <em style={{ color: "#C9A96E" }}>review</em></h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setRvErr(null);
                if (!user) {
                  setReviewOpen(false);
                  navigate({ to: "/auth" });
                  return;
                }
                if (!rvName.trim() || !rvBody.trim()) {
                  setRvErr("Please fill in your name and review.");
                  return;
                }
                setRvBusy(true);
                try {
                  const res = await createPublicReview({
                    data: { author_name: rvName.trim(), rating: rvRating, body: rvBody.trim() },
                  });
                  // Optimistically prepend the new review so it appears immediately.
                  const grid = document.getElementById("userReviewsGrid");
                  if (grid && res?.review) {
                    grid.insertAdjacentHTML("afterbegin", renderReviewCard(res.review, 0));
                  }
                  setRvName(""); setRvBody(""); setRvRating(5);
                  setReviewOpen(false);
                  // Scroll user to the review section so they can see it.
                  document.getElementById("userReviewsGrid")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  await refreshReviews();
                } catch (err) {
                  setRvErr(err instanceof Error ? err.message : "Failed to submit");
                } finally {
                  setRvBusy(false);
                }
              }}
            >
              <input value={rvName} onChange={(e) => setRvName(e.target.value)} placeholder="Your name" required maxLength={80}
                style={{ width: "100%", background: "rgba(8,8,8,0.6)", border: "0.5px solid rgba(201,169,110,0.25)", color: "#F5F0E8", padding: "14px 16px", marginBottom: 12, outline: "none", fontFamily: "inherit", fontSize: 14 }} />
              <div style={{ display: "flex", gap: 6, marginBottom: 14, fontSize: 28 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setRvRating(s)} style={{ background: "none", border: "none", cursor: "pointer", color: s <= rvRating ? "#E8D5A3" : "rgba(245,240,232,0.25)", fontSize: 28, padding: 0, lineHeight: 1 }} aria-label={`${s} star`}>★</button>
                ))}
              </div>
              <textarea value={rvBody} onChange={(e) => setRvBody(e.target.value)} placeholder="Tell us about your experience…" required maxLength={1000} rows={4}
                style={{ width: "100%", background: "rgba(8,8,8,0.6)", border: "0.5px solid rgba(201,169,110,0.25)", color: "#F5F0E8", padding: "14px 16px", marginBottom: 12, outline: "none", fontFamily: "inherit", fontSize: 14, resize: "vertical" }} />
              {rvErr && <p style={{ color: "#E89A8A", fontSize: 12, margin: "0 0 12px" }}>{rvErr}</p>}
              <button type="submit" disabled={rvBusy}
                style={{ width: "100%", background: "#C9A96E", color: "#080808", padding: "14px 20px", border: "none", fontSize: 11, fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", cursor: rvBusy ? "not-allowed" : "pointer", opacity: rvBusy ? 0.6 : 1 }}>
                {rvBusy ? "Submitting…" : "Submit review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
