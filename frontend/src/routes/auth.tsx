import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — GlowMe" },
      { name: "description", content: "Sign in to book India's finest makeup, hair, and nail artists on GlowMe." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@200;300;400;500&display=swap",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const redirect = search.get("redirect") || "";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notRobot, setNotRobot] = useState(false);

  async function routeAfterAuth() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    // Customer flow only. If a user with an existing artist account signs in here,
    // still send them to the homepage — artist sign-in has its own dedicated route.
    if (redirect) { navigate({ to: redirect }); return; }
    navigate({ to: "/" });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) routeAfterAuth(); });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!notRobot) { setErr("Please confirm you're not a robot."); return; }
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name, role: "customer" } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      await routeAfterAuth();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (!notRobot) { setErr("Please confirm you're not a robot."); return; }
    setErr(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setBusy(false);
      setErr(result.error instanceof Error ? result.error.message : String(result.error));
    }
  }

  return (
    <div className="gm-auth-root">
      <style>{`
        .gm-auth-root{
          --black:#080808;--off-black:#111010;--dark:#1A1714;--gold:#C9A96E;--gold-light:#E8D5A3;--gold-dark:#9A7A45;
          --cream:#F5F0E8;--muted:#8A7D70;
          --dp:'Playfair Display',serif;--cg:'Cormorant Garamond',serif;--body:'Jost',sans-serif;
          min-height:100vh;background:var(--black);color:var(--cream);font-family:var(--body);font-weight:300;
          position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:48px 20px;
        }
        .gm-auth-root::before{
          content:'';position:absolute;inset:-20%;background:
            radial-gradient(circle at 20% 20%,rgba(201,169,110,0.12),transparent 45%),
            radial-gradient(circle at 80% 80%,rgba(154,122,69,0.10),transparent 50%),
            radial-gradient(circle at 50% 50%,rgba(232,213,163,0.04),transparent 60%);
          pointer-events:none;z-index:0;
        }
        .gm-auth-root::after{
          content:'';position:absolute;inset:0;
          background-image:linear-gradient(rgba(201,169,110,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,169,110,0.04) 1px,transparent 1px);
          background-size:60px 60px;mask-image:radial-gradient(ellipse at center,black 30%,transparent 75%);
          -webkit-mask-image:radial-gradient(ellipse at center,black 30%,transparent 75%);
          pointer-events:none;z-index:0;
        }
        .gm-auth-shell{position:relative;z-index:1;width:100%;max-width:460px;}
        .gm-logo{display:flex;align-items:center;justify-content:center;font-family:var(--dp);font-size:34px;font-weight:700;letter-spacing:0.06em;color:var(--cream);text-decoration:none;margin-bottom:36px;}
        .gm-logo span{color:var(--gold);font-style:italic;}
        .gm-card{
          background:linear-gradient(180deg,rgba(26,23,20,0.85),rgba(17,16,16,0.95));
          border:0.5px solid rgba(201,169,110,0.25);
          padding:44px 38px;backdrop-filter:blur(12px);
          box-shadow:0 30px 80px -20px rgba(0,0,0,0.8),0 0 0 1px rgba(201,169,110,0.06) inset;
          position:relative;
        }
        .gm-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);opacity:0.6;}
        .gm-eyebrow{font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:var(--gold);margin-bottom:14px;display:flex;align-items:center;gap:12px;}
        .gm-eyebrow::before{content:'';display:block;width:24px;height:0.5px;background:var(--gold);}
        .gm-title{font-family:var(--dp);font-size:34px;font-weight:400;line-height:1.1;color:var(--cream);margin-bottom:10px;}
        .gm-title em{font-style:italic;color:var(--gold);}
        .gm-sub{font-family:var(--cg);font-size:16px;line-height:1.6;color:rgba(245,240,232,0.6);margin-bottom:30px;}
        .gm-google{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;border:0.5px solid rgba(201,169,110,0.5);background:none;color:var(--gold);padding:14px 20px;font-family:var(--body);font-size:11px;font-weight:400;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;transition:all 0.3s;}
        .gm-google:hover{background:var(--gold);color:var(--black);border-color:var(--gold);}
        .gm-divider{display:flex;align-items:center;gap:14px;margin:24px 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:var(--muted);}
        .gm-divider::before,.gm-divider::after{content:'';flex:1;height:0.5px;background:rgba(201,169,110,0.2);}
        .gm-field{width:100%;background:rgba(8,8,8,0.6);border:0.5px solid rgba(201,169,110,0.25);color:var(--cream);padding:14px 16px;font-family:var(--body);font-size:14px;letter-spacing:0.02em;transition:all 0.25s;margin-bottom:12px;outline:none;}
        .gm-field::placeholder{color:rgba(245,240,232,0.35);letter-spacing:0.05em;}
        .gm-field:focus{border-color:var(--gold);background:rgba(8,8,8,0.85);box-shadow:0 0 0 3px rgba(201,169,110,0.08);}
        .gm-error{color:#E89A8A;font-size:12px;margin:6px 0 12px;letter-spacing:0.04em;}
        .gm-submit{width:100%;background:var(--gold);color:var(--black);padding:15px 20px;font-family:var(--body);font-size:11px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;border:none;cursor:pointer;transition:all 0.3s;margin-top:6px;}
        .gm-submit:hover{background:var(--gold-light);transform:translateY(-1px);}
        .gm-submit:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
        .gm-switch{margin-top:24px;width:100%;background:none;border:none;color:var(--muted);font-family:var(--body);font-size:11px;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer;transition:color 0.3s;}
        .gm-switch:hover{color:var(--gold);}
        .gm-foot{margin-top:24px;text-align:center;font-family:var(--cg);font-size:13px;color:rgba(245,240,232,0.4);letter-spacing:0.04em;}
        .gm-foot a{color:var(--gold);text-decoration:none;border-bottom:0.5px solid rgba(201,169,110,0.4);}
        .gm-foot a:hover{border-color:var(--gold);}
      `}</style>

      <div className="gm-auth-shell">
        <Link to="/" className="gm-logo">Glow<span>Me</span></Link>

        <div className="gm-card">
          <div className="gm-eyebrow">{mode === "signin" ? "Welcome back" : "Join GlowMe"}</div>
          <h1 className="gm-title">
            {mode === "signin" ? <>The art of <em>access.</em></> : <>Begin your <em>journey.</em></>}
          </h1>
          <p className="gm-sub">
            {mode === "signin"
              ? "Sign in to book India's finest artists and manage appointments."
              : "Save artists, book in seconds, and unlock curated beauty experiences."}
          </p>

          <button onClick={google} className="gm-google" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 11v3.2h5.2c-.2 1.3-1.6 3.8-5.2 3.8-3.1 0-5.7-2.6-5.7-5.8s2.6-5.8 5.7-5.8c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.7 4 14.6 3 12 3 6.9 3 2.8 7.1 2.8 12s4.1 9 9.2 9c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1-.1-1.6H12z"/></svg>
            Continue with Google
          </button>

          <div className="gm-divider">or with email</div>

          <form onSubmit={submit}>
            {mode === "signup" && (
              <input className="gm-field" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            )}
            <input type="email" className="gm-field" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" className="gm-field" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <label style={{display:"flex",alignItems:"center",gap:10,margin:"4px 0 14px",fontSize:12,letterSpacing:"0.06em",color:"rgba(245,240,232,0.7)",cursor:"pointer"}}>
              <input type="checkbox" checked={notRobot} onChange={(e)=>setNotRobot(e.target.checked)} style={{width:18,height:18,accentColor:"#C9A96E",cursor:"pointer"}} />
              I'm not a robot
            </label>
            {err && <p className="gm-error">{err}</p>}
            <button disabled={busy} className="gm-submit" type="submit">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="gm-switch">
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>

          <div style={{marginTop:18,paddingTop:18,borderTop:"0.5px solid rgba(201,169,110,0.18)",textAlign:"center"}}>
            <Link to="/artist/auth" style={{color:"#C9A96E",fontSize:11,letterSpacing:"0.22em",textTransform:"uppercase",textDecoration:"none"}}>
              Are you an artist? Sign in here →
            </Link>
          </div>
        </div>

        <p className="gm-foot">
          By continuing you agree to our <a href="#">Terms</a> & <a href="#">Privacy</a>.
        </p>
      </div>
      {busy && (
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"#080808",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:18,color:"#C9A96E",fontFamily:"'Jost',sans-serif",letterSpacing:"0.22em",textTransform:"uppercase",fontSize:11}}>
          <div style={{width:42,height:42,border:"2px solid rgba(201,169,110,0.2)",borderTopColor:"#C9A96E",borderRadius:"50%",animation:"gmSpin 0.8s linear infinite"}} />
          <div>Signing you in…</div>
          <style>{`@keyframes gmSpin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </div>
  );
}
