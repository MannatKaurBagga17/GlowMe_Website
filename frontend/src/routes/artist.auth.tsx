import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/artist/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Artist Sign in — GlowMe" },
      { name: "description", content: "Sign in to your GlowMe artist dashboard." },
    ],
    links: [
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@200;300;400;500&display=swap" },
    ],
  }),
  component: ArtistAuthPage,
});

function ArtistAuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState<"Bengaluru" | "Chandigarh" | "Ludhiana">("Bengaluru");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notRobot, setNotRobot] = useState(false);

  async function hasArtistRow() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return false;
    const { data: existing, error } = await supabase.from("artists").select("id").eq("owner_id", u.user.id).maybeSingle();
    if (error) throw error;
    return !!existing;
  }

  async function ensureArtistRow() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Please sign in to continue.");
    const uid = u.user.id;
    const { data: existing, error: readError } = await supabase.from("artists").select("id").eq("owner_id", uid).maybeSingle();
    if (readError) throw readError;
    if (existing) return;
    const displayName = name || u.user.user_metadata?.full_name || u.user.email?.split("@")[0] || "New Artist";
    const baseSlug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `artist-${uid.slice(0, 6)}`;
    const slug = `${baseSlug}-${uid.slice(0, 6)}`;
    const { error: insertError } = await supabase.from("artists").insert({ owner_id: uid, slug, name: displayName, city });
    if (insertError) throw insertError;
  }

  async function routeAfterAuth(createIfMissing = true) {
    if (createIfMissing) await ensureArtistRow();
    navigate({ to: "/dashboard" });
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const oauthPending = sessionStorage.getItem("glowme_artist_oauth_pending") === "1";
      if (oauthPending) sessionStorage.removeItem("glowme_artist_oauth_pending");
      if (oauthPending) {
        await routeAfterAuth(true);
        return;
      }
      if (await hasArtistRow()) await routeAfterAuth(false);
    }).catch((e) => setErr(e instanceof Error ? e.message : "Failed to restore artist session"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!notRobot) { setErr("Please confirm you're not a robot."); return; }
    setErr(null); setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/artist/auth", data: { full_name: name, role: "artist" } },
        });
        if (error) throw error;
        await routeAfterAuth(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!(await hasArtistRow())) {
          await supabase.auth.signOut();
          throw new Error("No artist profile found for this login. Create an artist account first.");
        }
        await routeAfterAuth(false);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (!notRobot) { setErr("Please confirm you're not a robot."); return; }
    setErr(null); setBusy(true);
    sessionStorage.setItem("glowme_artist_oauth_pending", "1");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/artist/auth" });
    if (result.error) { setBusy(false); setErr(result.error instanceof Error ? result.error.message : String(result.error)); }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#080808", color: "#F5F0E8", fontFamily: "'Jost',sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 20px", position: "relative", overflow: "hidden",
    }}>
      <div aria-hidden style={{ position: "absolute", inset: "-20%", background: "radial-gradient(circle at 30% 30%, rgba(201,169,110,0.14), transparent 45%), radial-gradient(circle at 70% 70%, rgba(154,122,69,0.10), transparent 50%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 460 }}>
        <Link to="/" style={{ display: "flex", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 34, fontWeight: 700, color: "#F5F0E8", textDecoration: "none", marginBottom: 36 }}>
          Glow<span style={{ color: "#C9A96E", fontStyle: "italic" }}>Me</span>
        </Link>
        <div style={{ background: "linear-gradient(180deg,rgba(26,23,20,0.85),rgba(17,16,16,0.95))", border: "0.5px solid rgba(201,169,110,0.25)", padding: "44px 38px", backdropFilter: "blur(12px)", boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8)", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#C9A96E,transparent)", opacity: 0.6 }} />
          <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: 14 }}>Artist Portal</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, fontWeight: 400, lineHeight: 1.1, margin: "0 0 10px" }}>
            {mode === "signin" ? <>Welcome <em style={{ color: "#C9A96E" }}>back.</em></> : <>Join as an <em style={{ color: "#C9A96E" }}>artist.</em></>}
          </h1>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: "rgba(245,240,232,0.6)", margin: "0 0 30px" }}>
            {mode === "signin" ? "Sign in to your artist dashboard, bookings, and earnings." : "List your studio, accept bookings, and grow your business."}
          </p>

          <button onClick={google} type="button" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", border: "0.5px solid rgba(201,169,110,0.5)", background: "none", color: "#C9A96E", padding: "14px 20px", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 11v3.2h5.2c-.2 1.3-1.6 3.8-5.2 3.8-3.1 0-5.7-2.6-5.7-5.8s2.6-5.8 5.7-5.8c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.7 4 14.6 3 12 3 6.9 3 2.8 7.1 2.8 12s4.1 9 9.2 9c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1-.1-1.6H12z" /></svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#8A7D70" }}>
            <span style={{ flex: 1, height: 1, background: "rgba(201,169,110,0.2)" }} /> or with email <span style={{ flex: 1, height: 1, background: "rgba(201,169,110,0.2)" }} />
          </div>

          <form onSubmit={submit}>
            {mode === "signup" && (
              <input style={fieldStyle} placeholder="Studio / artist name" value={name} onChange={(e) => setName(e.target.value)} required />
            )}
            {mode === "signup" && (
              <select style={fieldStyle} value={city} onChange={(e) => setCity(e.target.value as typeof city)}>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Chandigarh">Chandigarh</option>
                <option value="Ludhiana">Ludhiana</option>
              </select>
            )}
            <input type="email" style={fieldStyle} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" style={fieldStyle} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <label style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 14px", fontSize: 12, color: "rgba(245,240,232,0.7)", cursor: "pointer" }}>
              <input type="checkbox" checked={notRobot} onChange={(e) => setNotRobot(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#C9A96E", cursor: "pointer" }} />
              I'm not a robot
            </label>
            {err && <p style={{ color: "#E89A8A", fontSize: 12, margin: "0 0 12px" }}>{err}</p>}
            <button disabled={busy} type="submit" style={{ width: "100%", background: "#C9A96E", color: "#080808", padding: "15px 20px", fontSize: 11, fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create artist account"}
            </button>
          </form>

          <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} style={{ marginTop: 24, width: "100%", background: "none", border: "none", color: "#8A7D70", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>
            {mode === "signin" ? "New artist? Create an account" : "Already have an account? Sign in"}
          </button>

          <div style={{ marginTop: 18, paddingTop: 18, borderTop: "0.5px solid rgba(201,169,110,0.18)", textAlign: "center" }}>
            <Link to="/auth" style={{ color: "#C9A96E", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", textDecoration: "none" }}>
              ← Are you a customer? Sign in here
            </Link>
          </div>
        </div>
      </div>
      {busy && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 18, color: "#C9A96E", letterSpacing: "0.22em", textTransform: "uppercase", fontSize: 11 }}>
          <div style={{ width: 42, height: 42, border: "2px solid rgba(201,169,110,0.2)", borderTopColor: "#C9A96E", borderRadius: "50%", animation: "gmSpin 0.8s linear infinite" }} />
          <div>Signing you in…</div>
          <style>{`@keyframes gmSpin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%", background: "rgba(8,8,8,0.6)", border: "0.5px solid rgba(201,169,110,0.25)",
  color: "#F5F0E8", padding: "14px 16px", fontSize: 14, marginBottom: 12, outline: "none", fontFamily: "inherit",
};